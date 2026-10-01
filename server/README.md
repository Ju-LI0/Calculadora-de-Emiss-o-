# API do Raiz

O servidor Node.js com Express fornece a API de cálculo e serve a interface estática de `public/` na mesma origem.

## Executar

Na raiz do projeto:

```sh
npm install
npm run dev
```

Abra `http://localhost:3000`. Para rodar os testes automatizados, use `npm test`. A porta pode ser alterada pela variável de ambiente `PORT`.

## Rotas

- `GET /api/health`: verifica se a API está ativa.
- `POST /api/calculations`: valida as entradas e retorna total anual, categorias, comparação global, recomendação e versão dos fatores.

A rota de cálculo recebe `transportModes`, `meals`, `flightHours`, `electricity`, `gasAmount` e `gasType`. `POST /api/food-estimate` estima o total diário e anual das refeições. As emissões alimentares são fatores médios aproximados por porção padrão, não uma análise nutricional ou de peso dos ingredientes. Os registros diários são guardados no `localStorage` do navegador; o servidor não os persiste. A projeção anual usa o dia selecionado como referência multiplicada por 365, portanto é uma estimativa de cenário e não o histórico real do ano.