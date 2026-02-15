# PWA Icons

Para que o PWA funcione corretamente, você precisa adicionar ícones nesta pasta.

## Requisitos

- **icon-192x192.png**: Ícone de 192x192 pixels
- **icon-512x512.png**: Ícone de 512x512 pixels

## Como Criar

### Opção 1: Usando um Gerador Online

1. Acesse: https://realfavicongenerator.net/ ou https://favicon.io/
2. Faça upload de um logotipo ou imagem (mínimo 512x512px)
3. Gere os ícones PWA
4. Baixe e extraia nesta pasta

### Opção 2: Usando Ferramentas de Design

**Com Canva:**
1. Crie um design 512x512px
2. Use um design simples com o nome ou iniciais do grupo
3. Exporte como PNG
4. Redimensione para 192x192px (pode usar https://imageresizer.com)

**Com Figma/Adobe:**
1. Crie artboards de 512x512px e 192x192px
2. Design o ícone
3. Exporte como PNG

## Design Sugerido

Para um projeto de "Pequenos Grupos":
- **Cor de fundo**: Indigo/Purple (#4f46e5)
- **Símbolo**: Iniciais "PG" em branco
- **Estilo**: Flat, minimalista, moderno

## Placeholder Temporário

Enquanto não tiver ícones próprios, você pode usar:
1. Baixar ícones genéricos de: https://www.flaticon.com
2. Ou criar um ícone com texto usando: https://placeholder.com

Exemplo de URL temporária (substitua depois):
```
https://via.placeholder.com/192x192/4f46e5/ffffff?text=PG
https://via.placeholder.com/512x512/4f46e5/ffffff?text=PG
```

## Verificação

Após adicionar os ícones, teste:
1. Abra o app no navegador
2. Abra DevTools (F12) → Application → Manifest
3. Verifique se os ícones aparecem corretamente
4. Tente instalar o PWA (botão de instalação deve aparecer)

## Importante

- Use PNG (não JPG)
- Fundo sólido ou transparente (evite gradientes complexos)
- Bordas arredondadas são aplicadas automaticamente pelo OS
- Teste em dispositivos reais (iOS e Android)
