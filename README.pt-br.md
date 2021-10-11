# next-themes ![tamanho do pacote minzip next-themes](https://img.shields.io/bundlephobia/minzip/next-themes) ![Versão](https://img.shields.io/npm/v/next-themes.svg?colorB=green)

Uma abstração para temas no seu app Next.js.

- ✅ Modo escuro perfeito com 2 linhas de código
- ✅ Configuração do Sistema com prefers-color-scheme
- ✅ UI do navegador tematizada com color-scheme
- ✅ Sem piscar durante carregamento (ambos SSR e SSG)
- ✅ Sincronize o tema em diferentes abas e janelas
- ✅ Desative o piscar ao trocar de temas
- ✅ Force temas específicos em páginas
- ✅ Seletor via classe ou data attribute
- ✅ Hook `useTheme`

Confira o [Exemplo](https://next-themes-example.vercel.app/) e teste você mesmo.

## Instalação

```bash
$ npm install next-themes
# ou
$ yarn add next-themes
```

## Uso

Você vai precisar de um [`App` Personalizado](https://nextjs.org/docs/advanced-features/custom-app) para usar next-themes. O modelo de `_app` mais simples se parece com:

```js
// pages/_app.js

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
```

Leva 2 linhas de código para adicionar suporte ao modo escuro:

```js
import { ThemeProvider } from 'next-themes'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
```

Simples assim, seu app Next.js tem suporte completo ao modo escuro, incluindo a preferência do Sistema com `prefers-color-scheme`. O tema também é automaticamente sincronizado entre abas. Por padrão, next-themes modifica o atributo `data-theme` no elemento `html`, que você pode facilmente usar para estilizar seu app:

```css
:root {
  /* Seu tema padrão */
  --background: white;
  --foreground: black;
}

[data-theme='dark'] {
  --background: black;
  --foreground: white;
}
```

### useTheme

Sua UI vai precisar saber o tema atual para ser capaz de mudá-lo. O hook `useTheme` fornece informações sobre o tema:

```js
import { useTheme } from 'next-themes'

const ThemeChanger = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      O tema atual é: {theme}
      <button onClick={() => setTheme('light')}>Modo claro</button>
      <button onClick={() => setTheme('dark')}>Modo escuro</button>
    </div>
  )
}
```

> **Aviso!** O código acima não é seguro a hidratação e irá emitir um aviso de divergência na hidratação ao renderizar com SSG ou SSR. Isso acontece pois não podemos saber o `theme` no servidor, logo ele sempre será `undefined` até ser montado no cliente.
>
> Você deve sempre esperar pra renderizar qualquer UI que troque o tema até ser montando no cliente. Veja o [exemplo](#evite-divergência-na-hidratação).

## API

Vamos nos aprofundar nos detalhes.

### ThemeProvider

Toda sua configuração do tema é passada para o ThemeProvider.

- `storageKey = 'theme'`: Chave usada para guardar a configuração do tema no localStorage
- `defaultTheme = 'system'`: Nome padrão do tema (na versão v0.0.12 ou anterior o padrão era `light`). Se `enableSystem` for falso, o tema padrão é `light`
- `forcedTheme`: Nome do tema forçado para a página atual (não altera as configurações salvas do tema)
- `enableSystem = true`: Se altera para `dark` ou `light` baseado em `prefers-color-scheme`
- `enableColorScheme = true`: Se diz ao browser qual esquema de cores está sendo usado (claro ou escuro) para UI integradas como inputs e botões
- `disableTransitionOnChange = false`: Desativa opcionalmente todas transições CSS ao mudar o tema ([exemplo](#desativar-transições-na-troca-de-tema))
- `themes = ['light', 'dark']`: Lista dos nomes de temas
- `attribute = 'data-theme'`: Atributo HTML a ser modificado com base no tema ativo
  - aceita `class` e `data-*` (qualquer data attribute, `data-mode`, `data-color`, etc.) ([exemplo](#classe-ao-invés-de-data-attribute))
- `value`: Mapeamento opcional do nome do tema para valor do atributo
  - value é um `objeto` onde a chave é o nome do tema e o valor é o valor do atributo ([exemplo](#divergir-atributo-do-DOM-e-nome-do-tema))

### useTheme

useTheme não leva nenhum parâmetro, mas retorna:

- `theme`: Nome do tema atual
- `setTheme(name)`: Função para atualizar o tema
- `forcedTheme`: Tema forçado na página ou falso. Se `forcedTheme` for definido, você deve desativar qualquer UI que altere o tema
- `resolvedTheme`: Se `enableSystem` for verdadeiro e o tema ativo for "system", retorna se a preferência do sistema resolve em "dark" ou "light". Caso contrário, é idêntico a `theme`
- `systemTheme`: Se `enableSystem` for verdadeiro, representa o tema de preferência do Sistema ("dark" ou "light"), indiferente do tema ativo
- `themes`: Lista de temas passados para o `ThemeProvider` (com "system" junto, se `enableSystem` for verdadeiro)

Nada mal, certo? Vamos ver como usar tais propriedades com exemplos:

## Exemplos

O [Exemplo](https://next-themes-example.vercel.app/) mostra next-themes em ação, com temas escuro, claro, do sistema e páginas com temas forçados.

### Usar preferência do Sistema por padrão

O `defaultTheme` é "light". Se você quiser respeitar a preferência do Sistema em vez disso, defina como "system":

```js
<ThemeProvider defaultTheme="system">
```

### Ignorar a preferência do Sistema

Se você não quiser um tema do Sistema, desative-o via `enableSystem`:

```js
<ThemeProvider enableSystem={false}>
```

### Classe ao invés de data attribute

Se o seu app Next.js usa uma classe para estilizar a página baseada no tema, mude a prop attribute para `class`:

```js
<ThemeProvider attribute="class">
```

Assim sendo, definir o tema como "dark" irá definir `class="dark"` no elemento `html`.

### Força o tema de uma página

Digamos que a sua nova página de marketing tem apenas modo escuro. A página usará sempre o tema escuro, e mudar o tema não deve ter efeito algum. Para forçar o tema em suas páginas Next.js, simplesmente defina uma variável no componente page:

```js
// pages/awesome-page.js

const Page = () => { ... }
Page.theme = 'dark'
export default Page
```

Em seu `_app`, leia a variável e passe-a para o ThemeProvider:

```js
function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider forcedTheme={Component.theme || null}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

Pronto! Sua página sempre usará o tema escuro (apesar da preferência do usuário), e chamar `setTheme` de `useTheme` agora não faz nada. Contudo, you deve ter certeza que desativou qualquer UI que normalmente mudaria o tema:

```js
const { forcedTheme } = useTheme()

// O tema foi forçado, não deveríamos deixar o usuário mudar o tema
const disabled = !!forcedTheme
```

### Desativar transições na troca de tema

Eu escrevi sobre [essa técnica aqui](https://paco.sh/blog/disable-theme-transitions). Nós podemos forçadamente desativar todas transições CSS antes do tema ser trocado, e reativá-las em seguida. Isso garante que sua UI com durações diferentes de transição não será inconsistente ao mudar de tema.

Para habilitar esse comportamente, passe a prop `disableTransitionOnChange`:

```js
<ThemeProvider disableTransitionOnChange>
```

### Divergir atributo do DOM e nome do tema

O nome do tema ativo é usado tanto como valor no localStorage quanto valor do atributo do DOM. Se o nome do tema for "rosa", o localStorage terá `theme=rosa` e o DOM será `data-theme="rosa"`. Você **não pode** modificar o valor do localStorage, mas você **pode** modificar o valor do DOM.

Se nós quisermos, ao invés disso, que o DOM renderize `data-theme="meu-tema-rosa"` quando o tema for "rosa", passe a prop `value`:

```js
<ThemeProvider value={{ rosa: 'meu-tema-rosa' }}>
```

Pronto! Para ser mais claro, isso afetas apenas o DOM. Veja como todos os valores ficarão:

```js
const { theme } = useTheme()
// => "rosa"

localStorage.getItem('theme')
// => "rosa"

document.documentElement.getAttribute('data-theme')
// => "meu-tema-rosa"
```

### Mais do que modo claro e escuro

next-themes foi pensando para dar suporte a inúmeros temas! Simplesmente passe uma lista de temas:

```js
<ThemeProvider themes={['rosa', 'vermelho', 'azul']}>
```

> **Observação!** Quando você passa `themes`, o conjunto padrão de temas ("light" e "dark") é sobrescrevido. Certifique-se de os incluir se ainda quiser os temas claro e escuro:

```js
<ThemeProvider themes={['rosa', 'vermelho', 'azul', 'claro', 'escuro']}>
```

### Sem variáveis CSS

Essa livraria não depende da sua estilização usar variáveis CSS. Você pode escrever os valores na mão em seu CSS, e tudo funcionará como esperado (sem piscar):

```css
html,
body {
  color: #000;
  background: #fff;
}

[data-theme='dark'],
[data-theme='dark'] body {
  color: #fff;
  background: #000;
}
```

### Com Styled Components ou qualquer CSS-in-JS

Next Themes é completamente independente do CSS, e funcionará com qualquer livraria. Por exemplo, com Styled Components você só precisa `createGlobalStyle` em seu App personalizado:

```js
// pages/_app.js
import { createGlobalStyle } from 'styled-components'
import { ThemeProvider } from 'next-themes'

// Your themeing variables
const GlobalStyle = createGlobalStyle`
  :root {
    --fg: #000;
    --bg: #fff;
  }

  [data-theme="dark"] {
    --fg: #fff;
    --bg: #000;
  }
`

function MyApp({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}
```

### Evite Divergência na Hidratação

Já que não podemos saber o `theme` no servidor, vários dos valores retornados por `useTheme` serão `undefined` até serem montados no cliente. Isso significa que se você tentar renderizar UI baseada no tema atual antes de montar no cliente, você terá um erro de divergência na hidratação.

O código a seguir **não é seguro**:

```js
import { useTheme } from 'next-themes'

const ThemeChanger = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      O tema atual é: {theme}
      <button onClick={() => setTheme('light')}>Modo claro</button>
      <button onClick={() => setTheme('dark')}>Modo escuro</button>
    </div>
  )
}
```

Para consertar isso, certifique-se de renderizar UI que usa o tema atual apenas quando a página for montada no cliente: 

```js
import { useTheme } from 'next-themes'

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div>
      O tema atual é: {theme}
      <button onClick={() => setTheme('light')}>Modo claro</button>
      <button onClick={() => setTheme('dark')}>Modo escuro</button>
    </div>
  )
}
```

Para evitar [Alteração no Layout](https://web.dev/cls/), considere renderizar um esqueleto da página/placeholder até montar no lado do cliente.

Por exemplo, com [`next/image`](https://nextjs.org/docs/basic-features/image-optimization) você pode usar uma imagem vazia até o tema ser resolvido.

```js
import Image from 'next/image'
import { useTheme } from 'next-themes'

function ThemedImage() {
  const { resolvedTheme } = useTheme()
  let src

  switch (resolvedTheme) {
    case 'light':
      src = '/light.png'
      break
    case 'dark':
      src = '/dark.png'
      break
    default:
      src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      break
  }

  return <Image src={src} width={400} height={400} />
}
```

### Com Tailwind

[Visite o exemplo](https://next-themes-tailwind.vercel.app) • [Veja o código fonte do exemplo](https://github.com/pacocoursey/next-themes/tree/master/examples/tailwind)

> OBSERVAÇÃO! Tailwind tem suporte ao modo escuro apenas na versão >2.

No seu `tailwind.config.js`, defina a propriedade modo escuro como classe:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class'
}
```

Defina o atributo do seu Theme Provider como classe:

```js
// pages/_app.js
<ThemeProvider attribute="class">
```

Se você estiver usando a prop `value` para especificar diferentes valores de atributo, garanta que o seu tema escuro usa explicitamente "dark" como valor, como exigido pelo Tailwind.

Acabou! Agora você pode usar classes específicas do modo escuro:

```js
<h1 className="text-black dark:text-white">
```

## Discussão

### O Piscar

O ThemeProvider automaticamente injeta um script em `next-head` para atualizar o elemento `html` com os atributos corretos antes do resto da página carregar. Isso significa que a página não irá piscar sob nenhuma circunstância, incluindo temas forçados, tema do sistema, múltiplos temas, e anônimo. Nenhum `noflash.js` necessário.

## FAQ

---

**Por que minha página continua piscando?**

No modo de desenvolvimento do Next.js, a página ainda pode piscar. Quando você fizer a build do seu app no modo de produção, não haverá nenhum piscar.

---

**Por que eu recebo o erro de divergência na hidratação servidor/cliente?**

Ao usar `useTheme`, você verá um erro de divergência na hidratação ao renderizar UI que depende do tema atual. Isso porque vários dos valores retornados por `useTheme` são indefinidos no servidor, já que não podemos ler o `localStorage` até montar no cliente. Veja o [exemplo](#evite-divergência-na-hidratação) para resolver o erro.

---

**Eu preciso usar variáveis CSS com essa livraria?**

Não. Veja o [exemplo](#sem-variáveis-css).

---

**Eu posso definir a classe ou data attribute no body ou outro elemento?**

Não. Se você tiver um bom motivo para dar suporte a essa funcionalidade, por favor abra uma issue.

---

**Eu posso usar esse pacote com Gatsby ou CRA?**

Não.

---

**O script injedado foi minificado?**

Sim, usando Terser.

---

**Por que `resolvedTheme` é necessário?**

Ao dar suporte às preferências de tema do Sistema, você quer garantir a consistência da sua UI. Ou seja, os seus botões, selects, dropdowns, ou o que quer que seja que indica o tema atual deve dizer "Sistema" quando o tema de preferência do Sistema estiver ativa.

Se nós não diferenciássemos `theme` e `resolvedTheme`, a UI mostraria "Dark" ou "Light", quando deveria ser "System".

`resolvedTheme` é útil, então, para modificar comportamentos ou estilos no tempo de execução:

```js
const { resolvedTheme } = useTheme()

<div style={{ color: resolvedTheme === 'dark' ? white : black }}>
```

Se nós não tivéssemos `resolvedTheme`, mas apenas `theme`, você perderia inforamções sobre o estado de sua UI (você só saberia que o tema é "system", mas não no que ele resolveria).
