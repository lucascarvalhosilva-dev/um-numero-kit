# Moldura do longo vertical (1080x1920) — monta o longo 16:9 inteiro dentro da moldura.
# Entrada: bg.png (moldura renderizada de moldura-vertical-longo.html) + o longo 16:9 final.
# Ajuste D (duração do longo em segundos), o caminho do longo e os nomes de saída a cada episódio.
# Barra de progresso: trilho #D9D1C1 e barra azul #3255A4 (940x14) em x=70, y=1200; vídeo 1080x608 em y=559.
D=340.533
FC="[1:v]scale=1080:608:flags=lanczos[v];[3]format=rgba[b];[2][b]overlay=x='-940+940*t/$D':y=0[tr];[0][v]overlay=0:559[a];[a][tr]overlay=70:1200,format=yuv420p"
ffmpeg -v error -y -loop 1 -framerate 30 -i bg.png -i ../final/UmNumero_EP01_Selic_PT_16x9.mp4 -f lavfi -i "color=c=#D9D1C1:s=940x14:r=30" -f lavfi -i "color=c=#3255A4:s=940x14:r=30" -filter_complex "$FC" -map 1:a -c:v libx264 -crf 20 -preset medium -r 30 -c:a copy -t $D -movflags +faststart UmNumero_EP01_Selic_PT_9x16.mp4 || { echo FALHOU_HQ > done.txt; exit; }
# Versão leve para envio (2 passadas, ~540 kbps), quando o arquivo HQ passa do limite de envio.
I=UmNumero_EP01_Selic_PT_9x16.mp4
ffmpeg -v error -y -i $I -c:v libx264 -b:v 540k -preset fast -pass 1 -an -f mp4 /dev/null && ffmpeg -v error -y -i $I -c:v libx264 -b:v 540k -preset fast -pass 2 -c:a aac -b:a 112k -movflags +faststart UmNumero_EP01_Selic_PT_9x16_envio.mp4 && echo OK > done.txt || echo FALHOU_ENVIO > done.txt
