# City OS

Gestor.IA V3 — Nova Base do Produto

Criar uma nova versão do aplicativo Gestor.IA V3, mantendo integralmente a identidade visual oficial já aprovada do Gestor.IA.

1. Regra principal

A V3 deve ser uma evolução do produto, não uma mudança de identidade visual.

Manter exatamente a paleta institucional existente:

Verde institucional: #1F6B3A

Verde escuro: #174F2C

Amarelo institucional: #F4C430

Branco para superfícies e contraste.

Não criar novas cores principais.

Não alterar a logomarca oficial.

Não redesenhar ou recriar a identidade visual.

Utilizar sempre os arquivos oficiais das logomarcas fornecidos para o projeto.

2. Conceito do produto

O Gestor.IA V3 não deve ser tratado como um simples portal de protocolos.

O conceito central é:

Sistema Operacional da Cidade.

O cidadão não deve precisar conhecer a estrutura interna da prefeitura para utilizar o sistema.

A experiência deve ser organizada pelas necessidades reais da população.

O princípio fundamental é:

Cada tela deve responder a uma necessidade real do cidadão, e não simplesmente refletir a estrutura administrativa da prefeitura.

3. Portal do Cidadão

A Home deve funcionar como um verdadeiro Super App da Cidade.

O cidadão deve conseguir:

acompanhar sua cidade;

resolver problemas;

solicitar serviços;

conversar com a prefeitura;

receber alertas;

acompanhar protocolos;

consultar serviços;

realizar agendamentos;

participar da cidade.

4. Estrutura inicial da Home

Criar a arquitetura considerando:

Header Inteligente

Logomarca Gestor.IA

Saudação dinâmica

Nome do cidadão

Localização obtida automaticamente pelo GPS

Clima

Notificações

Busca de serviços

Nunca inserir cidades fictícias ou cidades fixas no código.

A localização deve ser obtida dinamicamente por geolocalização.

Cidade em Tempo Real

Mapa vivo

Localização do cidadão

Ocorrências

Alertas

Obras

Eventos

Informações relevantes da cidade

Assistente IA

Criar uma área central com a pergunta:

“O que você precisa resolver hoje?”

O cidadão deve poder escrever normalmente, por exemplo:

“Minha rua está sem iluminação.”

“Preciso marcar uma consulta.”

“Quero pagar meu IPTU.”

“Meu filho precisa de vaga em creche.”

“Tem uma árvore caída na rua.”

A IA deve identificar a intenção e encaminhar o cidadão para o serviço adequado.

Jornadas do Cidadão

Organizar os serviços pela vida do cidadão:

Minha Cidade

Preciso de Ajuda

Minha Saúde

Minha Educação

Minha Casa

Minha Família

Meu Trabalho

Meus Protocolos

Não organizar a experiência principal por secretarias.

5. Prefeitura Conectada

Criar uma área para:

comunicados;

obras;

eventos;

avisos;

campanhas;

informações importantes.

6. Meus Protocolos

Centralizar:

solicitações;

documentos;

agendamentos;

histórico;

notificações;

andamento dos serviços.

7. Design

A interface deve transmitir:

produto SaaS premium;

tecnologia;

confiança;

simplicidade;

modernidade;

sofisticação;

acessibilidade.

Referências de qualidade visual:

Apple

Stripe

Linear

Vercel

Palantir

Não copiar essas marcas. Usá-las apenas como referência de nível de acabamento.

8. Arquitetura

Construir a V3 com arquitetura modular.

Cada grande seção deve ser um componente independente e reutilizável.

Estrutura conceitual:

src/

├── app/

├── components/

│   ├── landing/

│   ├── citizen/

│   ├── ai/

│   └── shared/

├── features/

│   ├── city/

│   ├── health/

│   ├── education/

│   ├── housing/

│   ├── family/

│   ├── work/

│   └── protocols/

├── services/

├── hooks/

└── lib/

Não criar componentes gigantes.

Não duplicar código.

Não criar soluções provisórias que depois precisem ser reconstruídas.

9. Escalabilidade

A arquitetura deve permitir futuramente adicionar:

Painel do Cidadão

Painel do Prefeito

Painel do Secretário

Painel do Governador

Painel Estadual

Painel de indicadores

módulos de IA

novos serviços municipais

Todos devem compartilhar o mesmo Design System.

10. Desenvolvimento

Antes de implementar funcionalidades complexas:

Definir arquitetura.

Definir Design System.

Definir navegação.

Criar a Home.

Criar componentes independentes.

Testar cada componente.

Integrar os componentes.

Testar a experiência completa.

Não copiar a V1 inteira.

Quando houver componentes úteis da versão anterior, utilizar apenas como referência e reconstruí-los dentro da arquitetura V3.

11. Regra absoluta

Não alterar a identidade visual aprovada.

Não inventar cidades.

Não inventar dados.

Não criar informações fictícias para simular funcionamento real quando o sistema puder obter os dados dinamicamente.

A V3 deve nascer com uma arquitetura limpa, modular, escalável e preparada para se tornar o Sistema Operacional da Cidade.

Primeiro arquitetura. Depois código.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed0ff312-649a-4bb8-bdc7-840953db42ab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
