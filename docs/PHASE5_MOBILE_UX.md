# Musical Sense | Fase 5: revisão da UX mobile a partir dos prints

## Diagnóstico de quatro telas reais

Os prints da versão anterior mostravam situações concretas:

1. **Início**: grande destaque duplicando informações do instrumento, botão Trocar enorme, cartão da música com atribuição longa e dois submenus em cartões altos. Havia grande competição visual com a ação principal.
2. **Trilha**: as onze aulas do ukulele apareciam expandidas de uma vez, com muitos repetidores de duração, XP e estágio. O aluno percorria a página inteira para encontrar a próxima aula.
3. **Praticar**: a meta de cinco minutos ocupava um cartão muito grande; três aulas já presentes na Trilha apareciam novamente como conteúdo principal.
4. **Perfil**: o botão Trocar aluno já existia na barra superior, mas também ocupava espaço no cartão central. As três métricas em colunas estreitas quebravam mal a expressão "Ainda sem dados". Perfis e configurações eram sempre exibidos.

O ícone do ukulele aparecia como uma flor, visualmente inadequado ao instrumento.

## Mudanças

### Início

- Cartão principal mais compacto e com um único CTA de aula.
- Acesso de troca de instrumento pequeno e legível, sem o antigo botão grande.
- Progresso e nível passam a compartilhar uma linha.
- Créditos instrumentais curtos no cartão de música; a procedência completa permanece nos detalhes.
- Dois grupos recolhíveis, reduzidos: Mais atividades e Minha evolução.
- A recomendação segue o instrumento ativo.

### Trilha

- Capítulos agrupados: Primeiros passos, Sua primeira música, Ritmo e técnica e Mais melodias quando aplicável.
- Apenas o capítulo da próxima aula começa aberto. Ao concluir aulas, a abertura acompanha o próximo capítulo.
- A ação principal é o próximo passo, visível no alto.
- Cada capítulo mostra seu progresso e pode ser expandido para abrir qualquer aula.
- Os identificadores, checkpoints, XP e quantidade de aulas permanecem os mesmos. Nenhuma aula é bloqueada pela mudança de UX.

### Praticar

- Meta diária de cinco minutos em uma linha de progresso compacta.
- Duas práticas recomendadas para começar, com opções adicionais em submenu.
- Apenas exercícios apropriados para o instrumento selecionado.
- Biblioteca musical e trilha acessíveis sem poluição visual.

### Perfil

- Cartão do aluno mais baixo; a troca de aluno permanece no seletor superior.
- Três atalhos de jornada permanecem visíveis.
- Meu desempenho é um submenu com aulas, precisão e tempo praticado.
- Conta e preferências agrupa os perfis da família e configurações.
- Texto "Sem práticas" substitui "Ainda sem dados" nas estatísticas, que agora são secundárias.

### Navegação e identificação

- Ícones de traço SVG no menu mobile: Início, Trilha, Músicas, Praticar/Cantar e Perfil.
- Ícones reagem à cor da aba ativa, ao contrário dos emojis que permaneciam com cor fixa.
- O indicador do ukulele mudou de flor para um símbolo de instrumento de cordas.
- Alvos de toque com aproximadamente 44 px ou mais, com atenção a 320, 375, 390 e 430 px de largura.

## Critérios de aceite

- Todas as onze aulas do ukulele continuam acessíveis na Trilha.
- A próxima aula fica visível sem rolar a lista inteira.
- Somente um capítulo fica aberto por padrão e muda ao avançar o aluno.
- Trocar de instrumento não altera os registros de aula, XP, favoritos, histórico ou checkpoint.
- O perfil mantém configurações e gestão familiar, agora recolhidas.
- A tela Início mantém acesso para trocar o instrumento, um CTA principal e uma recomendação.
- O menu mobile tem cinco destinos e ícones coerentes com o estado ativo.
- Sem alterações ao motor de áudio ou catálogo da Fase 4.

## Validação

O GitHub Actions executa os testes de unidade e jornadas simuladas, incluindo `tests/ux-phase5.test.mjs`.
A inspeção de responsividade e o comportamento real de toque em Safari/iOS devem ser verificados em dispositivos físicos antes de considerar a UX definitivamente validada.
