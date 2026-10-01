# Raiz — Calculadora de Pegada de Carbono

Aplicação web para estimar emissões anuais de gases de efeito estufa em toneladas de CO₂ equivalente (tCO₂e). O projeto combina uma interface em HTML, CSS e JavaScript puro com uma API Node.js e Express. Não usa framework de front-end nem banco de dados.

## Funcionalidades

- Estimativa de transporte, energia da casa e alimentação.
- Vários meios de transporte por cálculo: bicicleta, carro, moto e ônibus, com opções de motorização compatíveis.
- Cálculo de veículos elétricos usando consumo estimado por quilômetro e fator da rede elétrica.
- Diário de refeições por data, com horário, composição do prato e quantidade de porções.
- Estimativa por refeição, total diário e projeção alimentar anual.
- Comparação com a referência global de 4,5 tCO₂e por pessoa ao ano.
- Gráfico de distribuição por categoria e recomendação para a maior fonte de emissão.
- Interface responsiva e acessível, com navegação por teclado nas abas.

## Requisitos

- Node.js 20 ou superior.
- npm, instalado junto com o Node.js.

## Instalação e execução

No terminal, na pasta raiz do projeto:

```sh
npm install
npm run dev
```

Abra <http://localhost:3000> no navegador. O servidor disponibiliza tanto a interface quanto a API na mesma origem.

Para iniciar sem reinício automático:

```sh
npm start
```

A porta padrão é `3000`. Para usar outra porta, defina a variável de ambiente `PORT` antes de iniciar o servidor.

## Como usar

1. Na aba **Transporte**, adicione os meios utilizados, selecione a motorização e informe os quilômetros percorridos por mês. As horas de voo são informadas por ano.
2. Na aba **Casa**, informe o consumo mensal de energia elétrica e gás. Escolha botijão de 13 kg ou gás natural em m³.
3. Na aba **Alimentação**, selecione a data e adicione as refeições do dia. Para cada refeição, escolha o horário, a composição do prato e o número de porções. Os valores diários são estimados enquanto os dados são preenchidos.
4. Selecione **Calcular pegada** para atualizar o total anual, a comparação, o gráfico e a recomendação.

As refeições são salvas no armazenamento local (`localStorage`) do navegador, separadas por data. O servidor não cria contas e não persiste os dados. Para apagar um registro alimentar, selecione a data e remova as refeições desejadas.

## Organização do projeto

```text
CARBON-CALC/
├── public/
│   ├── index.html                  # Estrutura semântica da interface
│   ├── style.css                   # Layout, tema e regras responsivas
│   └── script.js                   # Interações, armazenamento local e chamadas à API
├── server/
│   ├── README.md                   # Notas sobre a API
│   ├── src/
│   │   ├── app.js                  # Configuração Express e servidor HTTP
│   │   ├── constants/
│   │   │   └── emissionFactors.js  # Fatores de emissão adotados
│   │   ├── controllers/
│   │   │   └── calculationController.js
│   │   ├── routes/
│   │   │   └── calculationRoutes.js
│   │   ├── services/
│   │   │   └── carbonService.js    # Fórmulas, totais e recomendações
│   │   ├── validators/
│   │   │   └── calculationValidator.js
│   └── test/
│       ├── api.test.js
│       ├── calculationValidator.test.js
│       └── carbonService.test.js
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## API

### `GET /api/health`

Verifica se o servidor está ativo.

```json
{ "status": "ok" }
```

### `POST /api/food-estimate`

Calcula emissões alimentares diárias e a projeção anual. As porções são limitadas a 30 por requisição, com até 20 porções por refeição.

```json
{
  "meals": [
    { "mealType": "lunch", "food": "beef", "servings": 1 },
    { "mealType": "dinner", "food": "vegan", "servings": 1 }
  ]
}
```

Horários permitidos: `breakfast`, `lunch`, `snack`, `dinner`.

Composições permitidas: `beef`, `pork`, `chicken`, `fish`, `dairy-eggs`, `vegetarian`, `vegan`.

A resposta inclui as emissões individuais, o total do dia em kgCO₂e e a projeção anual em tCO₂e.

### `POST /api/calculations`

Calcula as três categorias e devolve o total, comparação, recomendação e versão dos fatores. Exemplo de corpo:

```json
{
  "transportModes": [
    { "mode": "car", "propulsion": "combustion", "kmPerMonth": 100 }
  ],
  "flightHours": 0,
  "electricity": 100,
  "gasAmount": 0,
  "gasType": "cylinder",
  "meals": [
    { "mealType": "lunch", "food": "beef", "servings": 1 }
  ]
}
```

Cada objeto de `transportModes` aceita um meio e uma motorização compatível:

| Meio (`mode`) | Motorização (`propulsion`) |
| --- | --- |
| `bicycle` | `pedal`, `electric` |
| `car` | `combustion`, `hybrid`, `electric` |
| `motorcycle` | `combustion`, `hybrid`, `electric` |
| `bus` | `combustion`, `hybrid`, `electric` |

`kmPerMonth` representa a distância mensal de cada meio. `flightHours` é anual. `electricity` é kWh por mês. `gasAmount` é botijões de 13 kg por mês quando `gasType` é `cylinder`, ou m³ por mês quando é `natural`.

Entradas inválidas retornam HTTP 400 com um código de erro e detalhes por campo. Os fatores e limites são verificados no servidor, independentemente da validação visual do navegador.

## Como as estimativas são calculadas

Os fatores estão centralizados em `server/src/constants/emissionFactors.js`. Entradas mensais são anualizadas multiplicando por 12; horas de voo já são anuais. Os fatores atuais incluem:

- Carro a combustão: 0,19 kgCO₂e/km; híbrido: 0,12 kgCO₂e/km.
- Moto a combustão: 0,10 kgCO₂e/km; híbrida: 0,07 kgCO₂e/km.
- Ônibus a combustão: 0,08 kgCO₂e/km; híbrido: 0,06 kgCO₂e/km.
- Veículos elétricos: consumo médio estimado por tipo de veículo multiplicado por 0,08 kgCO₂e/kWh da rede.
- Bicicleta a pedal: zero emissão operacional direta.
- Energia elétrica residencial: 0,08 kgCO₂e/kWh; gás: fator mensal específico para botijão ou gás natural.
- Alimentação: fator aproximado por porção padrão, entre 0,4 kgCO₂e para refeição vegana e 3,0 kgCO₂e para prato com carne bovina.

A categoria alimentar anual considera as refeições do dia selecionado como se esse padrão se repetisse por 365 dias. É uma projeção de cenário, não um histórico do ano. Os fatores são médias simplificadas: podem variar com região, veículo, fonte de energia, ingredientes e tamanho real das porções. Não são uma medição oficial nem substituem fontes especializadas.

## Testes

Execute a suíte automatizada na raiz:

```sh
npm test
```

Os testes verificam fórmulas e anualização, validação de entradas, estimativa alimentar e integração HTTP da API com os arquivos estáticos.

## Tecnologias

- HTML5, CSS3 e JavaScript Vanilla no navegador.
- Node.js e Express 5 no servidor.
- `node:test` para testes automatizados.
