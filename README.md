# Kit de motion · Um Número

Motor de render do canal **Um Número** (economia em PT-BR): cenas em HTML/canvas na identidade "economia impressa em risografia", renderizadas com Playwright + ffmpeg.

## Montar numa sessão
```bash
git clone --depth 1 https://github.com/lucascarvalhosilva-dev/um-numero-kit.git /tmp/k && cp -r /tmp/k/kit ~/kit && cd ~/kit
npm install --silent @fontsource/big-shoulders-display @fontsource/newsreader @fontsource/fragment-mono
```
(ou `bash montar_kit.sh` da skill um-numero-producao, que faz o mesmo)

## O que tem
| Caminho | Para quê |
| --- | --- |
| `kit/render.py` | cena HTML → MP4 com efeitos sonoros (`--frames` gera prévias) |
| `kit/common.js`, `kit/base-prim.js`, `kit/fonts.css` | base comum: camadas de tinta, primitivas, fontes |
| `kit/vertical/vertical.py` + `vertical/modelo/` | pipeline do vertical falado: `novo`, `audio`, `previa`, `capa`, `render` (TEMPO=1.15; SO_VIDEO / SO_MIX) |
| `kit/infog/infog.html` + `motor.js` | infográfico mudo, 10 formatos (`?t=<tema>` lê `infog/temas/<tema>.js`) |
| `kit/infog/build.py`, `build2.py` | geram os temas a partir das séries oficiais baixadas em `/home/claude/dados` |
| `kit/moldura-vertical-longo.sh` | moldura 9:16 para cortes do longo |

O EP. 01, os exemplos de vertical e as legendas ficam só no projeto do Claude (referência).
As regras de uso estão nos arquivos do projeto (`claude/visual-e-kit.md`, `claude/infograficos.md`).

## Regra
Mudou algo no kit durante uma produção → commit aqui no mesmo dia, para a próxima sessão já clonar a versão certa.
