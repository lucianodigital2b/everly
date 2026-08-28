# Everly — Brief para App Store / Play Store Screenshots

Documento para o designer. Objetivo: produzir o set de screenshots (e, opcionalmente, o
App Preview em vídeo) das lojas. Aqui está o que o app é, para quem, qual é a vibe,
o que a concorrência faz, e um roteiro sugerido tela a tela.

**Você vai receber acesso ao app por TestFlight.** A seção 4 é um roteiro de navegação —
como chegar em cada tela que interessa, e o que preparar antes para que ela apareça
bonita na hora da captura.

---

## 1. O que é o Everly

**Everly é o álbum coletivo de um evento.** O anfitrião cria o evento no app, os
convidados escaneiam um QR code e tiram fotos com a câmera do próprio Everly — e a
galeria inteira só é **revelada** no momento que o anfitrião escolheu.

O fluxo completo, em cinco passos:

1. **Criar o evento** — nome e tipo (Wedding, Birthday, Trip, Anniversary, Party, Other).
2. **Escolher o momento da revelação** — *Instant* (as fotos aparecem na hora),
   *End of Event* (a galeria abre de uma vez quando o evento acaba) ou *Scheduled*
   (abre na hora marcada).
3. **Limitar os disparos** — X fotos por convidado (ou ilimitado). É a mecânica de
   câmera descartável: cada foto conta, ninguém dispara 200 vezes.
4. **Definir o filtro** — o anfitrião escolhe **um** look analógico e *todos* os
   convidados fotografam nele. É isso que faz o álbum parecer um só rolo de filme, e
   não 40 câmeras diferentes. Presets atuais: Original, Kodak Gold, Fuji Superia,
   Faded Film, Noir.
5. **Convidar** — QR code na tela ou impresso na mesa. **O convidado não precisa de
   conta**: escaneia, fotografa, envia.

Depois: todo mundo abre a galeria junta e vê, pela primeira vez, a festa pelos olhos
de todos os outros.

### O modelo de negócio (relevante para as screenshots)

Não há assinatura. O evento nasce grátis com **5 convidados**; pacotes de convidados
avulsos ampliam **um evento específico** (10 / 25 / 50 / 100 / 150 / ilimitado,
US$ 1,99 → US$ 69,99). Isso significa que a screenshot precisa vender **o evento**,
não "assine o Everly".

### O que o Everly **não** é

Não é rede social. Não tem feed público, não tem likes, não tem seguidores, não tem
gamificação, não tem streak. Nada disso deve aparecer nas telas.

---

## 2. Público e ocasiões

- **Persona principal:** a pessoa que organiza — noiva/noivo, quem faz aniversário,
  quem organiza a viagem, quem casa. 22–40 anos, estética-consciente, já usa Pinterest
  e Instagram para planejar o evento.
- **Persona secundária:** o convidado, que só escaneia e fotografa.
- **Ocasião nº 1 é casamento** (é o caso de uso que justifica os pacotes maiores e o
  ticket alto). Aniversário e viagem vêm em seguida.
- **A loja é em inglês** — o app é todo em inglês, não há versão em português.
  Os textos das screenshots devem ser em inglês.

---

## 3. A vibe

**Palavras-chave:** editorial, romântico, suave, caro, calmo, analógico, Apple-like.
Pense em convite de casamento e revista de fotografia — não em app de tecnologia.

**Evitar terminantemente:** gradientes saturados, roxo/azul de startup, 3D genérico,
emoji, ícones em bolinhas coloridas, confete, badges de gamificação, "AI-powered",
mockups em perspectiva com sombra dura, fundo preto.

### Paleta

| Nome | Hex | Uso |
|---|---|---|
| Fundo primário | `#FBF8F5` | branco quente da página — **fundo padrão das screenshots** |
| Fundo secundário | `#FFFFFF` | cards flutuantes |
| Superfície | `#F5EDEA` | off-white rosado — chips, inputs, também a cor do splash |
| **Accent** | `#E6A9B4` | blush rosé — a cor da marca |
| Accent claro | `#F4CED5` | tints, topo de gradiente |
| Accent profundo | `#C77E8D` | rosé escuro — texto/ícone sobre fundo claro |
| Tinta primária | `#2E2429` | quase-preto, levemente ameixa |
| Tinta secundária | `#8B7C82` | texto de apoio |
| Tinta terciária | `#B9AAB0` | texto terciário |
| Sálvia | `#7FA88C` | status "Live" |
| Terracota | `#D08A83` | erro / destrutivo |

O accent é pastel — **não sustenta texto branco em cima**. Onde o rosé precisar ser
legível sobre fundo claro, use o accent profundo `#C77E8D`.

### Tipografia

- **Inter** em toda a interface — de `ExtraLight (200)` a `ExtraBold (800)`.
- O gesto tipográfico característico do app: **uma palavra em ExtraLight, a seguinte em
  ExtraBold**, empilhadas, mesmo corpo, com `letter-spacing` negativo (−1 a −1.5).
  Ex.: "Good" *(fino)* / "**evening,**" *(pesado)*; "beautiful" *(fino)* **moments** *(pesado)*.
  **Esse contraste é a assinatura da marca — use nos headlines das screenshots.**
- **Wordmark:** "everly" em **Sacramento** (script), sempre em minúsculas, com o "ly"
  final em accent `#E6A9B4`.
- Não há nenhuma serifada no app. Se você viu algo falando em Playfair Display ou em
  dourado `#C6A96B`, é a identidade antiga — foi substituída.

### Linguagem visual dos componentes

- Cantos generosos: cards 26–28px, pílulas 999px.
- Sombras longas e macias (`y: 16–18, blur: 20–26, opacity ~0.25`), nunca duras.
- Fotos em cards com **moldura branca de 5px** (efeito Polaroid) e leve rotação
  (−10° a +20°) — é assim que a tela de boas-vindas empilha as fotos.
- Vidro fosco para as pills de status sobre foto.
- Bordas hairline quase invisíveis, em preto a ~7% de opacidade.

---

## 4. Roteiro de navegação — onde achar cada tela no TestFlight

### Antes de começar: prepare o material

As telas ficam vazias e sem graça num app recém-instalado. Antes de capturar:

1. Crie **2 ou 3 eventos** com nomes bonitos e realistas (ex.: *Sofia & Daniel*,
   *Amalfi, June*, *Mariana turns 30*) — a home só fica boa com uma lista.
2. Dê **capa** a todos eles. As capas são o que carrega a screenshot.
3. Suba **6 a 12 fotos** em pelo menos um evento, todas do mesmo casamento/festa e todas
   no mesmo filtro. É o que faz a galeria e o contador ("07 photos so far") existirem.
4. Deixe um evento em cada estado: **Live** (rolando), **Revealed** (já aberto) e um
   *Scheduled* — os três têm pills de status de cor diferente.

Se precisar de ajuda para popular a conta com dados, peça — dá para deixar tudo pronto
antes de você entrar.

### As telas, em ordem de valor para as screenshots

**⭐⭐ Welcome** — a primeira tela do app, antes do login.
Fotos em molduras brancas deslizando num arco contínuo, wordmark em script no topo,
headline "beautiful **moments**" surgindo letra a letra. *Já é praticamente uma
screenshot pronta.* Para revê-la depois de logado: Settings → Sign Out.

**⭐⭐ Reveal preview** — Aba central (+) → passo 2 do wizard, "Choose the reveal moment".
Duas fotos lado a lado ganham um **véu gelado** quando você seleciona qualquer modo que
não seja *Instant*. É a melhor imagem do app inteiro e é exatamente a ideia que
vendemos. Toque entre *Instant* e *End of Event* para ver a transição.

**⭐⭐ Event detail** — toque em qualquer evento na home.
Capa em tela cheia com blur atrás, o nome do evento repetido em tipo gigante sangrando
pelas duas bordas ("ghost type"), contador em número grande ("**07** photos so far"),
badge do filtro, e os botões QR + "View gallery". Role para baixo e a folha da galeria
sobe por cima da foto. Muito editorial — captura tanto no topo quanto na galeria.

**⭐ Home / Events** — a primeira aba depois de logar.
Saudação "Good **evening,**" no gesto ExtraLight/ExtraBold, hero card alto com foto e
pill de status, três stats (guests / shots / reveal), lista de eventos abaixo.

**⭐ Wizard de criação** — aba central (+), 6 passos.
Barra de progresso no topo, headline em duas linhas por passo. Os passos que valem
capturar: **2 (reveal)**, **4 (filtro — grade de looks analógicos aplicados a uma foto)**
e **6 (quantos convidados — os tiers de preço)**.

**⭐ Câmera** — dentro de um evento, ou ao final do wizard.
Viewfinder preto com brackets nos cantos, readouts de Flash / Timer / Grid / Rear no
topo, botões com aparência metálica. Estética de câmera física de verdade. É a única
tela escura do app — funciona como contraponto no meio do set.

**QR / convite** — dentro de um evento, botão do QR code.
QR grande com o nome do evento acima. Sozinha é fraca, mas conta a parte da história que
mata a maior objeção do comprador ("meus convidados vão ter que baixar um app?").

**Fluxo do convidado** — abra a câmera do iPhone e escaneie o QR de um evento seu.
Mostra que dá para enviar foto sem conta. Bom para a screenshot nº 4 do roteiro.

**Settings** — não usar.

---

## 5. Concorrência

Dois territórios se cruzam no Everly. Vale olhar as listagens atuais de cada um antes de
desenhar — elas mudam com frequência.

### A) Apps de "revelação" / câmera analógica (a mecânica)

- **Lapse** — o gigante da categoria. Fotos "revelam" na manhã seguinte. Listagem toda
  preta/roxa, muito hype, muito social, muito Gen-Z. **É o oposto do nosso tom** — bom
  para se diferenciar por contraste: o Everly é o mesmo prazer da espera, mas adulto e
  bonito.
- **Dispo** — câmera descartável que revela às 9h. Estética de rolo de filme.
- **Huji Cam / POV / 1998 Cam** — filtros analógicos com data-stamp. Screenshots quase
  sempre = foto tratada em tela cheia.

**O que eles fazem bem:** vendem a *sensação* (grão, espera, nostalgia), não a UI.
**Onde deixam espaço:** são todos individuais/sociais. Nenhum é organizado em torno de
um evento com anfitrião, limite de convidados e QR.

### B) Apps de foto de evento / casamento (o caso de uso)

- **Guestpix, Wedbox, Eversnap, POP (Photo Party), Kululu** — funcionam por QR, sem
  conta para o convidado. Listagens genéricas: screenshots com muito texto, telas
  espremidas, look de utilitário. **É aqui que a nossa maior vantagem está: parecer
  caro.**
- **Joy (withjoy.com), Appy Couple, The Knot** — suítes completas de casamento (site,
  RSVP, lista de presentes). Marca bonita, mas o app de fotos é um recurso entre vinte.
- **Google Photos / Álbuns Compartilhados do iOS** — o concorrente grátis e invisível.
  Todo mundo já tem. A resposta do Everly: o álbum compartilhado é um depósito
  desorganizado de 400 fotos ruins; o Everly é **um álbum curado, com um só visual, que
  todos abrem juntos**.
- **A "hashtag do casamento"** — o comportamento que estamos substituindo.

### Ângulos de diferenciação a explorar nas screenshots

1. **O filtro único** — "one film for the whole night". Nenhum concorrente tem isso.
2. **A revelação coletiva** — o momento em que a galeria abre.
3. **O limite de disparos** — escassez que faz as fotos serem melhores.
4. **Zero fricção pro convidado** — QR, sem cadastro.
5. **A beleza** — num campo de utilitários feios, ser bonito *é* o posicionamento.

---

## 6. Roteiro sugerido — 7 screenshots

Headlines em inglês. Estrutura: caption curta no topo (ExtraLight + ExtraBold no mesmo
gesto tipográfico do app), device frame abaixo, fundo `#FBF8F5` ou `#F5EDEA`.
As **3 primeiras** são as que aparecem na busca da App Store — elas precisam contar a
história inteira sozinhas.

| # | Headline | Tela | Nota |
|---|---|---|---|
| 1 | `Everyone's camera.` / **`One album.`** | Welcome ou Event detail | Estabelece o conceito. Foto humana, real, quente. |
| 2 | `Nobody sees a thing` / **`until you say so.`** | Reveal preview, com o véu gelado sobre as fotos | O gancho emocional. Se só uma screenshot for vista, que seja esta. |
| 3 | `One film,` / **`for the whole night.`** | Passo do filtro, com a grade de looks | O diferencial que ninguém mais tem. |
| 4 | `They scan.` / **`That's it.`** | QR + convidado fotografando | Mata a objeção "meus convidados não vão baixar app". Deixar explícito: *no account needed*. |
| 5 | `Every shot counts.` | Câmera (viewfinder escuro com brackets) | Quebra visual do set — a única tela escura. |
| 6 | `Watch the album` / **`fill up.`** | Event detail ("07 photos so far") ou galeria revelada | Payoff. |
| 7 | `Weddings. Birthdays.` / **`Trips.`** | Home com múltiplos eventos + hero card | Amplia o caso de uso além de casamento. |

**Sobre as fotos de exemplo:** todas as fotos dentro do app nas screenshots devem ser
**do mesmo evento e com o mesmo tratamento** — casamento ou festa em luz natural, quente,
gente real, nada de banco de imagem corporativo. Se uma tela mostra Kodak Gold, todas
devem parecer Kodak Gold. Coerência aqui *é* a demonstração do produto.

---

## 7. Especificações de entrega

**App Store (iPhone apenas — o app não tem versão iPad)**
- Tamanho obrigatório: **1290 × 2796 px** (iPhone 6.9"). A Apple redimensiona para os
  demais aparelhos.
- Opcional para controle fino: 1242 × 2688 px (6.5").
- Até 10 por localização; **as 3 primeiras aparecem na busca**.
- PNG ou JPG, sem transparência, RGB.
- Se usar device frame, use um único modelo em todo o set, com hora e bateria
  padronizadas — nada de status bar inconsistente entre uma tela e outra.

**Google Play**
- 2 a 8 screenshots, **1080 × 1920 px** (lado menor ≥ 320px).
- **Feature graphic obrigatório: 1024 × 500 px** — sem texto essencial nas bordas, o
  card é cortado em alguns layouts. Sugestão: wordmark script sobre fotos em molduras
  brancas, fundo `#FBF8F5`.
- Ícone: 512 × 512 px.

**App Preview / vídeo promo (opcional, alta prioridade se houver budget)**
- 15–30s, sem áudio essencial (autoplay é mudo).
- O arco de storytelling que funciona: QR → convidados fotografando → contador subindo →
  **a revelação**. O momento em que o véu sai das fotos é o clímax.

**Formato de entrega**
- Fonte editável (Figma), com os textos em camadas de texto reais (não rasterizadas) —
  vamos querer testar variações de headline.
- Exportar em pastas separadas por loja e por tamanho.
- Nomear em ordem: `01_...`, `02_...` — a ordem *é* a narrativa.

---

## 8. Checklist rápido

**Fazer**
- ✅ Fundo claro quente (`#FBF8F5` / `#F5EDEA`)
- ✅ Contraste ExtraLight + ExtraBold nos headlines, letter-spacing negativo
- ✅ Blush `#E6A9B4` com parcimônia — é acento, não é fundo
- ✅ Cantos 26–28px, sombras longas e macias
- ✅ Molduras brancas de 5px nas fotos, leve rotação
- ✅ Muito espaço em branco
- ✅ Máximo ~6 palavras por headline

**Não fazer**
- ❌ Dourado / serifada (identidade antiga, descontinuada)
- ❌ Gradiente roxo-azul, neon, fundo preto (exceto a tela de câmera)
- ❌ Emoji, confete, badges, setas desenhadas, "NEW!"
- ❌ Múltiplos telefones em perspectiva por screenshot
- ❌ Prometer o que não existe: não há edição de vídeo, não há AI, não há chat, não há
  feed social, não há assinatura
