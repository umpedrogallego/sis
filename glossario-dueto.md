
# <badge><cat-title>glossário-dueto <purple>v1.0</purple></cat-title></badge>
# Ponte de consulta entre a Sessão de Planejamento e o usuário

> **Propósito:** alinhar vocabulário. Escrito para quem cria com *vibe coding* — cada termo vem com
> *o que é*, *onde vive no voCOVER* e *um exemplo prático*. É o documento que a gente consulta antes de
> discutir qualquer decisão técnica daqui pra frente.
>
> **Convencões deste arquivo:** <ok>verde = conceito seguro/positivo</ok> · <warn>amarelo = cuidado</warn> ·
> <err>vermelho = armadilha/erro comum</err> · <badge>azul = termo-cabeçalho</badge>

---

## <cat-title>0. O mapa grande — onde cada termo vive</cat-title>

Todo o áudio do voCOVER percorre **um caminho só**, de ponta a ponta. Este é o mapa com os termos no
lugar exato deles:

```
                         ┌─────────────── A ENTRADA (mic) ───────────────┐
 mic ──► [callback] ──► push ──► [in_queue] ──► worker pega (timeout) ──┐
                          └─ se enche: drop-oldest                      │
                                                                        ▼
 ┌────────────────────────── O WORKER (thread única) ──────────────────────────────┐
 │  [pending] ──► resample (se preciso) ──► corta em [blocos] de 512               │
 │                                                                      │           │
 │   ┌─────────────────────── [render_block] (1 bloco = 11,6 ms) ───────┴────┐      │
 │   │  gate (attack/hold) ──► mix ──► grãos (ITD, pan) ──► _trigger_event   │      │
 │   │                                              │                       │      │
 │   │                         [buses] somam ────────┤                       │      │
 │   │                                              ▼                       │      │
 │   │                    [soft limit] (knee + tanh) = [limiter]             │      │
 │   └──────────────────────────────────────┬───────────────────────────────┘      │
 │                                          ▼                                       │
 │                          [push_output] + checagem de [profundidade]              │
 │                             └─ se funda: [drop] (descarta o bloco)               │
 └──────────────────────────────────────────┬───────────────────────────────────────┘
                                            ▼
                             [out_queue] (profundidade máx. 16)
                                            ▼
              ┌─────────────── A SAÍDA (fones/caixas) ───────────────┐
              │ [callback] de saída: tem bloco? ──não──► [fill(0)]   │
              │                                    (buraco = clique)│
              └──────────────────────────────────────────────────────┘

  FORA do caminho:  [render_sink]  = modo render offline (pula filas, grava direto)
  CULPADOS DE SISTEMA:  C-states, core parking, drift, streams/duplex
  FERRAMENTAS:  CLI, baseline, re-baselinar, headroom
```

---

## <cat-title>1. Transporte e filas (o correio do áudio)</cat-title>

### <badge>callback</badge>
**O que é:** uma função que você **escreve** mas que o **sistema operacional chama sozinho**, no
momento exato em que precisa — sem você pedir. No áudio, o driver chama o callback a cada poucos
milissegundos dizendo "dá um bloco de áudio agora" ou "aqui tem um bloco que chegou do mic".

- <ok>Vive fora do seu controle de fluxo normal — ele interrompe o que a thread estava fazendo.</ok>
- **No voCOVER:** `_input_callback` (`engine.py:2562`) e `_output_callback` (`engine.py:2591`).
- **Exemplo:** o Windows toca a campainha: *"callback, quero 512 samples AGORA"* — se você demorar,
  ele toca **silêncio**. É por isso que callbacks têm regra de ouro: **serem rápidos e nunca travar**.

### <badge>thread</badge> <badge>thread única</badge>
**O que é:** uma linha de execução do programa. **Thread única** = o programa faz **uma coisa por
vez**, em fila, na ordem.

- **No voCOVER:** o `worker` é uma *thread única* que faz **tudo** do áudio em sequência: pegar mic →
  preparar → renderizar → entregar.
- <warn>Se **uma etapa demora** (ex.: um evento de 80 ms), **todas as seguintes atrasam** — é o
  efeito dominó. Isso é a causa raiz de vários problemas de P7.</warn>

### <badge>worker</badge> <badge>worker loop</badge> **`VocoolderWorker`**
**O que é:** a thread de trabalho. O *loop* é o `while` que ela roda para sempre enquanto o motor
está ligado: pega mic → processa → entrega → repete. (`engine.py:2638`)

- **Relação:** o **callback** é o garçom urgente do sistema; o **worker** é a cozinha. O garçom
  entrega o pedido (mic) na fila e volta depois — a cozinha cozinha no próprio ritmo.

### <badge>push</badge>
**O que é:** "empurrar" um dado **para dentro** de uma fila. Operação de **produção** (colocar).
- **No voCOVER:** `_input_callback` faz `push` do áudio do mic no `in_queue`; `_push_output` faz
  `push` do bloco pronto no `out_queue`.

### <badge>in_queue</badge> <badge>out_queue</badge> (fila)
**O que é:** um **tubão temporário** entre quem produz e quem consome áudio — desacopla os dois
ritmos. `in_queue` = mic esperando processamento; `out_queue` = áudio pronto esperando a saída.

- **No voCOVER:** `in_queue` guarda até **8 blocos (~93 ms)**; `out_queue` até **16 (~186 ms)**.
- **Por que existe:** o mic chega no **ritmo do Windows**; o worker processa no **ritmo do CPU**;
  a saída consome no **ritmo da placa de som**. As três velocidades nunca são idênticas.

### <badge>profundidade</badge> (depth / `max_depth`)
**O que é:** **quantos blocos estão acumulados** na fila naquele instante.
- **No voCOVER:** `_push_output(out, max_depth=12 ...)` = "só aceita empurrar se tiver **menos de 12
  blocos** na fila".
- **Exemplo do seu código:** *"o gravador recebe o bloco antes da checagem de profundidade"* = o
  gravador ouve o áudio **mesmo que depois o bloco seja descartado** por causa da profundidade.

### <badge>drop</badge> <badge>drop-oldest</badge>
**`drop`** = descartar um bloco quando a fila está cheia (`engine.py:2631`).
**`drop-oldest`** = quando a fila de ENTRADA enche, **joga fora o bloco MAIS VELHO** para caber o
novo (`engine.py:2581`) — porque mic velho já não adianta nada.

- <err>Armadiilha: um `drop` = um buraco de 11,6 ms no som = **clique**. Dois caminhos de drop
  existem: descartar o que sai (2631) e descartar o que entra (2581).</err>

### <badge>underrun</badge>
**O que é:** o **consumidor queria** um bloco e **a fila estava vazia**. A saída não recebeu nada a
tempo. No voCOVER: `_output_callback` faz `fill(0)` → <err>buraco de silêncio no meio do som = clique
clássico</err>.

- <warn>No voCOVER, underrun **não aparece na gravação** (o gravador grava antes, na fila) — por
  isso seu relato "só no ao vivo, exportado belíssimo" aponta pra cá.</warn>
- **Sinônimo prático:** falha de entrega.

### <badge>fill(0)</badge>
**O que é:** "preencher com zeros" = **silêncio digital**. É o que o callback de saída faz quando a
fila está vazia (`engine.py:2596`) — em vez de travar, entrega silêncio. O ouvido percebe o zero como
um **clique de ida e volta**.

### <badge>timeout</badge>
**O que é:** "espero até X; se não vier, sigo sozinho".
- **No voCOVER:** `_in_queue.get(timeout=0.15)` = worker espera **150 ms** por mic novo; se nada
  chegar, ele **empurra um bloco de silêncio** e segue (`engine.py:2647-2649`).

### <badge>push_output</badge>
**O que é:** o `push` específico do bloco **já renderizado e já limitado** para a `out_queue`
(`engine.py:2623`). Decide: manda pro render offline (`render_sink`), manda pro gravador, e só então
tenta enfileirar — **respeitando a profundidade**.

---

## <cat-title>2. Tempo e blocos (o relógio do áudio)</cat-title>

### <badge>bloco</badge>
**O que é:** o **lote de amostras** processado de uma vez — a unidade mínima de trabalho. No
voCOVER: **512 samples @ 44,1 kHz = 11,6 ms**.

- **Exemplo:** é como um ônibus: você não processa passageiro por passageiro, processa **um ônibus
  cheio**. Tudo no motor (gate, mix, limitador) acontece **uma vez por ônibus**, e a menor sujeira
  possível que você pode causar dura **11,6 ms** — um ônibus inteiro.

### <badge>pending</badge>
**O que é:** o "resto esperando" na mão. Quando o worker recebe mic num tamanho que **não é
múltiplo exato de 512**, ele concatena num buffer (`pending`) e vai pegando pedaços de 512 daí
quando dá (`engine.py:2641,2654`).

- **Analogia:** sobrou massa de pão; junta com a próxima fornada até dar um pão inteiro.

### <badge>resample</badge>
**O que é:** **mudar a taxa de amostragem** (44,1 kHz → 48 kHz, etc.) — redesenhar o áudio em outra
velocidade. No voCOVER usa `resample_poly` só se `input_samplerate ≠ output_samplerate`
(`engine.py:2652-2653`).

- <warn>Custo de CPU extra **por bloco** — se o seu mic e sua caixa têm taxas diferentes, o worker
  paga pedágio o tempo todo.</warn>

---

## <cat-title>3. O motor de render (a cozinha)</cat-title>

### <badge>engine</badge> <badge>_render_block</badge>
**`engine`** = o coração do programa (`src/engine.py`): corpus, seleção de grãos, saída de áudio.
**`_render_block`** = o método que transforma **um bloco de mic em um bloco de som pronto**
(`engine.py:2663`): gate → mix → grãos → somas → limitador → push.

- **Relação:** `engine` é a **fábrica inteira**; `_render_block` é a **esteira que roda uma vez por
  bloco de 11,6 ms**.

### <badge>gate</badge> (aberto/fechado)
**O que é:** um portão automático por **RMS** (volume medido). Se você está falando alto o suficiente,
o gate **abre** (deixa passar/dispara eventos); se para, **fecha**.

- **No voCOVER:** `GATE_ATTACK_BLOCKS=2` e `GATE_HOLD_BLOCKS=3` (`engine.py:207-208`).
- <err>Corte seco: hoje o mic é cortado de **um bloco pro outro** quando o gate fecha (`2693`) —
  sem fade — e isso **cliqueia**. (candidato D do P7)</err>

### <badge>attack</badge> <badge>hold</badge>
- **attack** = por quantos **blocos consecutivos** o som precisa estar acima do limiar **para abrir**
  (no voCOVER: 2 blocos ≈ 23 ms — evita abrir com um estalo isolado).
- **hold** = por quantos blocos o gate **fica aberto depois** do som cair (3 blocos ≈ 35 ms — evita
  ficar tremendo abrindo/fechando entre sílabas).

### <badge>_trigger_event</badge>
**O que é:** o momento em que o motor **escolhe e dispara grãos** — similaridade, mutação, pan,
pitch, seleção (`engine.py:2867`). É o cérebro criativo, e roda **dentro** do worker, a cada
`EVENT_INTERVAL = 170 ms` enquanto o gate está aberto.

- <warn>Se demora, a esteira trava. Ver `event_time_warn`.</warn>

### <badge>event_time_warn</badge>
**O que é:** o termômetro do trigger. Mede quanto tempo cada evento levou; se passar de **80 ms**,
conta um aviso (`engine.py:2742-2745`). 80 ms ≈ **7 blocos** — ou seja: um evento lento poderia
esvaziar a fila inteira se a folga fosse menor.

- <badge>referência de alerta</badge> É o **indicador número 1** de que o worker vai causar underrun.

### <badge>buses</badge> (barramento)
**O que é:** um "trilho" onde vários sinais são **somados num canal só** antes de seguir.
- **No voCOVER:** `grain_bus` = trilho estéreo onde **todos os grãos daquele bloco somam**
  (`engine.py:2697`); depois ele é somado ao `out` junto com o mic.
- **Exemplo:** 30 grãos = 30 vozes somando no mesmo trilho → a soma fica alta → é aí que aparece o
  problema do <blue>soft limit</blue>.

### <badge>ITD</badge>
**O que é:** *Interaural Time Difference* — **diferença de tempo** entre o que chega na orelha
esquerda e na direita. O cérebro usa isso pra localizar de onde vem o som.

- **No voCOVER:** delay de até **0,7 ms** (efeito Haas) aplicado por grão (`ITD_MAX_MS`, `engine.py:188`,
  em `_write_grain`). Um grão chega **levemente antes** numa orelha → o cérebro ouve ele **de lado**.

### <badge>soft limit</badge> <badge>limiter</badge>
**`limiter`** = qualquer coisa que **segura o volume pra não estourar**. **`soft limit`** = o
limiter **gradativo** do voCOVER: abaixo do `knee` não mexe nada; acima, comprime cada vez mais forte
com uma curva `tanh` (`engine.py:1695-1710`).

- **No voCOVER:** aplicado no **fim** de todo bloco, antes do push (`2747`). Teto: **0,891 (−1 dBFS)**.

### <badge>knee</badge>
**O que é:** o **joelho** — o ponto onde o limitador **começa a agir**. VoCOVER: `KNEE = 0,70`.
- Abaixo de 0,70: áudio passa **intocadinho**. Acima: começa a apertar.
- <warn>Se a soma dos `buses` (mic + grãos) fica sempre acima de 0,70, o limitador está **trabalhando
  o tempo todo** = distorção contínua = "clipping" que você ouve. É o candidato E do P7.</warn>

### <badge>tanh</badge>
**O que é:** *hyperbolic tangent* — uma **curva matemática em S**. Zero → zero; sobe → cresce devagar
e **se achata** perto de 1. Serve pra "amassar" picos sem deixar passar de um teto.

- **Exemplo visual:**
  ```
  saída │        ──────── teto (0,891)
        │      /
        │    /  ← zona tanh: começa a esmagar
        │  /
        │ / ← zona linear (abaixo do knee)
        └──────────────── entrada
  ```
- <err>Armadilha: tanh **não é transparente** — quando ela trabalha forte, você ouve **saturação
  áspera**, não "limpeza". Exportado sai limpo porque o som renderizado não passa dessa luta.</err>

---

## <cat-title>4. Sistemas e Windows (os culpados de fora)</cat-title>

### <badge>C-states</badge>
**O que é:** estados de **hibernação parcial** da CPU. Ociosa, a CPU "dorme" (C6, C10...); pra
acordar leva microssegundos.

- <warn>Hipótese do P7: com o PC **ocioso**, o thread de áudio acorda **atrasado** → underrun →
  clique. Com o PC **cheio**, a CPU dorme menos → menos clique. Bate com o seu relato invertido!</warn>

### <badge>core parking</badge>
**O que é:** o Windows **desliga núcleos** da CPU quando não precisa deles (começa nos mais
rápidos). Efeito prático igual aos C-states: o motor de áudio pode ficar num núcleo **desligado**
no momento do callback.

### <badge>drift</badge> (de relógio)
**O que é:** dois aparelhos de áudio **discordam levemente** de quanto tempo é um segundo (relógios
de cristais imperfeitos). Ex.: seu mic entrega 44.100,03 samples/s e sua placa consome 44.099,97/s.

- **Efeito:** aos poucos, um lado acumula atraso → `in_queue` **enche devagar** → `drop-oldest` →
  clique periódico, "de vez em quando, sem explicação".

### <badge>streams</badge> <badge>duplex</badge>
- **stream** = um **fluxo** de áudio aberto (entrada é um stream, saída é outro).
- **duplex** = **um único stream** que faz entrada E saída **sincronizados pelo mesmo relógio**.
- **No voCOVER:** streams **separados** (`InputStream` + `OutputStream`, `engine.py:2366-2381`) —
  dois relógios independentes, sem duplex. <warn>É a porta de entrada do **drift** e de
  dessincronias entre o que você fala e o que sai.</warn>

### <badge>headroom</badge>
**O que é:** a **folga** entre o pico normal do seu som e o teto (0 dBFS). É o espaço onde os grãos
e o mic podem somar **sem bater no limiter**.

- **Exemplo:** se o som vive em −6 dB e o teto é 0, você tem **6 dB de headroom**.
- <ok>Projeto correto: **ganhar headroom no pontapé** (reduzir ganho por polifonia, ganho do mic
  disciplinado) em vez de deixar o `tanh` apagar incêndio. É o plano de P6+P7.</ok>

---

## <cat-title>5. Ferramentas e fluxo de trabalho</cat-title>

### <badge>CLI</badge>
**O que é:** *Command Line Interface* — rodar o programa **por comando de terminal** em vez da
janela gráfica.
- **No voCOVER:** `python main.py --render entrada.wav -o saida.wav`, `--selftest`, `--list-devices`.
- <ok>Vantagem: parâmetros **explícitos e repetíveis** — ideal pra testes comparáveis.</ok>

### <badge>baseline</badge> <badge>re-baselinar</badge>
- **baseline** = o **árbitro antigo**: um arquivo de referência gerado com o código de uma data
  (`renders/ref_granular_2026-10-22.wav`). Qualquer mudança futura se compara com ele.
- **re-baselinar** = **gerar um novo árbitro**, porque a mudança foi proposital e o antigo não
  representa mais o comportamento desejado.
- <warn>Exemplo do P6: se mudarmos o `mix` pra "volume do mic", o **mesmo comando CLI** passa a
  gerar som diferente → o ref de 22/10 perde o valor de comparação → precisa de decisão:
  re-baselinar **ou** manter o comportamento antigo no offline.</warn>

---

## <cat-title>6. Relação-rápida: termo ─ causa ─ efeito no seu ouvido</cat-title>

| Se você ouve... | Provém de... | Termo-chave |
|:--|:--|:--|
| clique seco, tipo "tac" | fila vazia na saída | <red>underrun → fill(0)</red> |
| clique no **fim das frases** | fila estoura com gate fechado (só 3 folga) | <red>drop em push_output</red> |
| clique "de vez em quando, aleatório" | worker atrasado pelo evento | <yellow>event_time_warn > 80 ms</yellow> |
| clique no mic entre palavras | gate corta sem fade | <yellow>gate attack/hold</yellow> |
| chiado/granulado "saturado", pior com mic no meio | buses somando acima do knee | <red>soft limit / tanh</red> |
| piora só com PC ocioso | CPU dormindo | <purple>C-states / core parking</purple> |
| piora com mais programas abertos | CPU sem folga pro worker | <purple>thread única</purple> |

---

<box-ok>
**Como usar este glossário:** em qualquer discussão, se eu usar um termo daqui sem contexto, mande
"&#8250; glossário" com a palavra — e eu reformulo com o exemplo prático. A meta é que a gente discuta
**decisões**, não vocabulário.
</box-ok>

<box-warn>
**Limites do documento:** este glossário explica **como o código está hoje**. Quando a semântica do
mix (P6) e o transporte (P7) mudarem, os itens `mix`, `soft limit`, `drop` e a tabela §6 são os
primeiros a atualizar — este arquivo entra na convenção de docs vivos do ORCHESTRA.
</box-warn>
