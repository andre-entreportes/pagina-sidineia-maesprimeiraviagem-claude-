# Página de vendas: Sem Medo de Ser Mãe de Primeira Viagem

Site estático publicado no Cloudflare Pages (`curso.sidineiaboiko.com.br`). Não tem etapa de build: o Cloudflare publica os arquivos da raiz como estão.

- `index.html`: página de vendas, com o Pixel da Meta (4240403222689302) e o rastreamento dos eventos ViewContent e CliqueCheckout, além do repasse de UTMs para a Hotmart.
- `privacidade/` e `termos/`: páginas legais.
- `assets/`: fotos, ilustrações, favicon, imagem de compartilhamento e fontes.

Os eventos InitiateCheckout e Purchase são enviados pela Hotmart (pixel nativo e API de Conversões). Não adicione esses eventos nesta página.
