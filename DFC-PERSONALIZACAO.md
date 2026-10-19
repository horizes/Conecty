# Sua DFC personalizada

No menu do painel, abra **Planilha DFC**. A seção apresenta os meses, total do período, média mensal e detalhamento dos pagamentos e recebimentos. Clique nos valores para conferir os lançamentos.

## Adaptar ao seu negócio

1. Clique em **Personalizar DFC**.
2. Crie os grupos de que precisa, altere seus nomes ou remova os que não usa. Você pode mudar a ordem e indicar se um grupo representa receita, pagamento, imposto ou retirada.
3. Em **Suas categorias**, escolha o nome de exibição e o grupo de cada categoria. A lista corresponde aos lançamentos do ano e conta selecionados.
4. Clique em **Salvar minha DFC**. As preferências são salvas neste navegador.

Novas categorias dos lançamentos entram automaticamente na planilha. Quando ainda não há classificação, os valores permanecem nos totais e aparece um aviso para revisão. Não é preciso modificar o código para cada nova despesa. Renomear no painel não altera o cadastro nem os valores no Omie.

No ambiente de testes GitHub Pages + Supabase, os ajustes de grupos e classificações feitos pela interface ficam somente neste navegador, separados pelo identificador da empresa. Não são compartilhados automaticamente entre acessos. **Restaurar padrão** recarrega o padrão inicial no formulário, e **Salvar minha DFC** aplica a alteração. Este pacote não inclui um editor administrativo de mapeamentos DFC compartilhados.

## Ler a planilha

- Filtros de ano, intervalo e conta organizam a consulta. Período e Média consideram somente o intervalo escolhido; os demais meses ficam atenuados.
- Grupos podem ser expandidos ou recolhidos. A busca encontra categorias do próprio negócio.
- Saídas aparecem entre parênteses. Traço significa zero. **n.d.** indica histórico indisponível ou classificação pendente.
- A média usa apenas os meses disponíveis, incluindo meses parciais identificados. Não transforma meses sem histórico em zero.
- Se houver pagamentos sem classificação, a separação de impostos aguarda revisão. O resultado de caixa continua incluindo todos os movimentos realizados.
- **Baixar planilha CSV** exporta o resumo e todas as categorias atuais, inclusive grupos recolhidos. A busca não limita o arquivo exportado.

Em **cliente-demo.html**, os valores são ilustrativos. No dashboard conectado **cliente.html?empresa=identificador**, os dados vêm do aplicativo Omie autorizado, depois de instalar o Supabase conforme **PASSO-A-PASSO-SUPABASE.md**. Nenhum valor financeiro do arquivo de referência foi incorporado. O conector consulta os últimos seis meses completos e o mês atual; histórico anual completo exige ampliar essa consulta. O resultado apresentado é de caixa, sem representar saldo bancário ou lucro contábil.
