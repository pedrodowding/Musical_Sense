# Musical Sense

PWA de aprendizagem musical com microfone, perfis locais, trilhas e pontuação.

## Deploy

Projeto estático: Vercel Framework Preset = Other; Output Directory = vazio. Cada push na main aciona deploy quando a integração GitHub/Vercel estiver habilitada.

## Limitações

Detecção monofônica experimental via autocorrelação. Acordes são ensinados nota por nota; reconhecimento polifônico, MIDI, repertório licenciado e sincronização de perfis ainda não implementados. Acesso ao microfone requer HTTPS e permissão do navegador. Dados dos alunos ficam no localStorage do dispositivo.

## Próximas etapas

Melhorar precisão no iPad com testes reais, adicionar detector polifônico e MIDI, construir trilhas pedagógicas e biblioteca de músicas originais/licenciadas.
