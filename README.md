# Musical Sense 🎹

Aplicativo web de aprendizagem musical com aulas visuais e avaliação das notas tocadas em um **piano ou teclado físico** pelo microfone do navegador.

## Versão atual

- Dashboard mobile-first, trilhas pedagógicas e exercícios guiados
- Partitura SVG dinâmica com notas atuais, concluídas e orientações de dedilhado
- Teclado visual informativo. **O aluno não precisa tocar na tela**
- Reconhecimento monofônico pelo microfone, estimativa YIN e indicação de frequência/afinação
- Estabilização de notas, detecção básica de ataques e orientação quando houver erro
- Entrada MIDI opcional em navegadores que suportam Web MIDI; Safari do iPad usa microfone
- Reprodução de demonstração sintetizada dos exercícios com Web Audio
- Perfis independentes, XP, estrelas, precisão, aulas concluídas e treinos
- Biblioteca inicial de melodias tradicionais, domínio público e exercícios didáticos
- PWA com Service Worker, manifesto, ícone SVG e suporte offline após instalação

## Como publicar

Repositório estático: importação Vercel como **Other**, sem Build Command e sem Output Directory. Cada push na branch main inicia um deploy na integração GitHub/Vercel já configurada.

## Como testar no iPad

1. Abrir endereço HTTPS no Safari, posicionar o iPad próximo ao instrumento.
2. Entrar em **Primeiros passos > Conheça o Dó central**. Permitir uso do microfone.
3. Tocar e sustentar um **Dó 4 (261,63 Hz)**. Observar indicador de volume, frequência e nota.
4. Repetir notas iguais **soltando a tecla entre ataques**. A aula deve avançar automaticamente.
5. Se o som for captado mas não houver nota estável, reduzir ruído, ajustar sensibilidade ou aproximar o iPad.

## Limitações honestas

- Detecção **monofônica** em estudo: acordes simultâneos e múltiplas vozes ainda não são analisados.
- Algoritmo, compatibilidade de iPad e latência **precisam de validação com instrumentos reais**. Nem todos os timbres/oitavas são captados de forma confiável.
- Exercícios de pulso e metrônomo ainda não certificam precisão rítmica e nem acompanham uma faixa com áudio profissional.
- Perfis usam localStorage neste dispositivo; não há login ou sincronização na nuvem.
- O metrônomo e os exemplos de áudio são sintetizados localmente, sem gravações comerciais.
- Outros instrumentos além de piano/teclado estão previstos, mas não têm trilhas próprias.
- No Safari do iPad, a Web MIDI API não está amplamente disponível. O microfone é o modo principal.
- Arquivos do app podem funcionar offline após o primeiro carregamento, mas capturar áudio e instalar PWA dependem das permissões e capacidades do navegador.
- O aplicativo é um projeto independente e não reutiliza código, ilustrações, músicas protegidas ou marca do Simply Piano.

## Referências funcionais

O design é uma implementação original de padrões de ensino musical: partitura, retorno em tempo real, lições curtas, teclado visual de referência e progressão. O projeto REA (morluto/rea) foi estudado como possibilidade de análise baseada em evidências, mas **não foi executado contra o aplicativo Simply Piano**.

## Arquivos

- index.html: inicialização do aplicativo
- styles.css: design system e layouts responsivos
- app.js: navegação, perfis, aulas, partitura e progresso
- music-data.js: conteúdo pedagógico e melodias
- audio-engine.js: reconhecimento de notas, MIDI e áudio de exemplo
- sw.js: cache de arquivos do PWA
- manifest.webmanifest e icon.svg: metadados e ícone
