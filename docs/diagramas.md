# Diagramas — Raízes do Nordeste

## 1. Diagrama de Casos de Uso

```mermaid
graph TB
    subgraph Atores
        CLI[👤 Cliente<br>App/Web/Totem]
        ATE[👤 Atendente<br>Balcão]
        COZ[👤 Cozinha]
        GER[👤 Gerente/Admin]
        PAG[🏦 Gateway Pagamento<br>Externo - Mock]
    end

    subgraph "Sistema Raízes do Nordeste"
        UC1[Cadastrar/Login]
        UC2[Consultar Cardápio<br>por Unidade]
        UC3[Realizar Pedido]
        UC4[Solicitar Pagamento]
        UC5[Atualizar Status<br>do Pedido]
        UC6[Controlar Estoque]
        UC7[Programa de<br>Fidelidade]
        UC8[Gerenciar<br>Promoções]
        UC9[Consultar<br>Auditoria]
    end

    CLI --> UC1
    CLI --> UC2
    CLI --> UC3
    CLI --> UC4
    CLI --> UC7

    ATE --> UC2
    ATE --> UC3
    ATE --> UC5

    COZ --> UC5

    GER --> UC6
    GER --> UC8
    GER --> UC9
    GER --> UC5

    UC4 --> PAG
```

---

## 2. DER (Diagrama Entidade-Relacionamento)

```mermaid
erDiagram
    USUARIOS {
        int id PK
        varchar nome
        varchar email UK
        varchar senha_hash
        varchar cpf UK
        varchar telefone
        enum role
        boolean ativo
        boolean consentimento_lgpd
        boolean consentimento_fidelidade
        timestamp created_at
        timestamp updated_at
    }

    UNIDADES {
        int id PK
        varchar nome
        varchar endereco
        varchar cidade
        varchar estado
        varchar telefone
        boolean ativa
        timestamp created_at
        timestamp updated_at
    }

    PRODUTOS {
        int id PK
        varchar nome
        text descricao
        decimal preco
        varchar categoria
        varchar imagem_url
        boolean ativo
        timestamp created_at
        timestamp updated_at
    }

    ESTOQUE {
        int id PK
        int unidade_id FK
        int produto_id FK
        int quantidade
        timestamp created_at
        timestamp updated_at
    }

    PEDIDOS {
        int id PK
        int cliente_id FK
        int unidade_id FK
        enum canal_pedido
        enum status
        enum forma_pagamento
        decimal total
        text observacao
        timestamp created_at
        timestamp updated_at
    }

    ITENS_PEDIDO {
        int id PK
        int pedido_id FK
        int produto_id FK
        int quantidade
        decimal preco_unitario
        decimal subtotal
        timestamp created_at
        timestamp updated_at
    }

    PAGAMENTOS {
        int id PK
        int pedido_id FK
        decimal valor
        enum forma_pagamento
        enum status
        varchar gateway_transaction_id
        jsonb gateway_response
        timestamp created_at
        timestamp updated_at
    }

    FIDELIDADE {
        int id PK
        int cliente_id FK
        int pontos_acumulados
        int pontos_utilizados
        int saldo_pontos
        timestamp created_at
        timestamp updated_at
    }

    HISTORICO_FIDELIDADE {
        int id PK
        int cliente_id FK
        int pedido_id FK
        enum tipo
        int pontos
        varchar descricao
        timestamp created_at
    }

    PROMOCOES {
        int id PK
        varchar nome
        text descricao
        enum tipo_desconto
        decimal valor_desconto
        int produto_id FK
        int unidade_id FK
        date data_inicio
        date data_fim
        boolean ativa
        timestamp created_at
        timestamp updated_at
    }

    AUDIT_LOGS {
        int id PK
        int usuario_id
        varchar acao
        varchar entidade
        int entidade_id
        jsonb dados_anteriores
        jsonb dados_novos
        varchar ip
        varchar user_agent
        timestamp created_at
    }

    USUARIOS ||--o{ PEDIDOS : "realiza"
    USUARIOS ||--o| FIDELIDADE : "possui"
    USUARIOS ||--o{ HISTORICO_FIDELIDADE : "acumula/resgata"
    UNIDADES ||--o{ PEDIDOS : "recebe"
    UNIDADES ||--o{ ESTOQUE : "possui"
    PRODUTOS ||--o{ ESTOQUE : "disponível em"
    PRODUTOS ||--o{ ITENS_PEDIDO : "compõe"
    PEDIDOS ||--o{ ITENS_PEDIDO : "contém"
    PEDIDOS ||--o| PAGAMENTOS : "gera"
    PEDIDOS ||--o{ HISTORICO_FIDELIDADE : "gera pontos"
    PRODUTOS ||--o{ PROMOCOES : "participa"
    UNIDADES ||--o{ PROMOCOES : "aplica"
```

---

## 3. Diagrama de Classes (Domínio)

```mermaid
classDiagram
    class Usuario {
        +int id
        +String nome
        +String email
        +String senha_hash
        +String cpf
        +String telefone
        +Enum role
        +Boolean ativo
        +Boolean consentimento_lgpd
        +Boolean consentimento_fidelidade
    }

    class Unidade {
        +int id
        +String nome
        +String endereco
        +String cidade
        +String estado
        +Boolean ativa
    }

    class Produto {
        +int id
        +String nome
        +String descricao
        +Decimal preco
        +String categoria
        +Boolean ativo
    }

    class Estoque {
        +int id
        +int unidade_id
        +int produto_id
        +int quantidade
        +movimentar(tipo, qtd)
    }

    class Pedido {
        +int id
        +int cliente_id
        +int unidade_id
        +Enum canal_pedido
        +Enum status
        +Enum forma_pagamento
        +Decimal total
        +criarPedido()
        +atualizarStatus(novoStatus)
        +cancelar()
    }

    class ItemPedido {
        +int id
        +int pedido_id
        +int produto_id
        +int quantidade
        +Decimal preco_unitario
        +Decimal subtotal
    }

    class Pagamento {
        +int id
        +int pedido_id
        +Decimal valor
        +Enum status
        +String gateway_transaction_id
        +JSON gateway_response
        +processar()
    }

    class Fidelidade {
        +int id
        +int cliente_id
        +int pontos_acumulados
        +int pontos_utilizados
        +int saldo_pontos
        +acumularPontos(valor)
        +resgatarPontos(qtd)
    }

    class Promocao {
        +int id
        +String nome
        +Enum tipo_desconto
        +Decimal valor_desconto
        +Date data_inicio
        +Date data_fim
        +Boolean ativa
    }

    Usuario "1" --> "*" Pedido : realiza
    Usuario "1" --> "0..1" Fidelidade : possui
    Unidade "1" --> "*" Pedido : recebe
    Unidade "1" --> "*" Estoque : controla
    Produto "1" --> "*" Estoque : disponível
    Produto "1" --> "*" ItemPedido : compõe
    Pedido "1" --> "*" ItemPedido : contém
    Pedido "1" --> "0..1" Pagamento : gera
    Produto "1" --> "*" Promocao : participa
    Unidade "1" --> "*" Promocao : aplica
```

---

## 4. Diagrama de Sequência — Fluxo Crítico (Pedido → Pagamento → Status)

```mermaid
sequenceDiagram
    participant C as Cliente (App/Totem/Web)
    participant API as API Raízes
    participant DB as PostgreSQL
    participant GW as Gateway Pagamento (Mock)

    C->>API: POST /auth/login {email, senha}
    API->>DB: Busca usuário + valida hash
    DB-->>API: Usuário encontrado
    API-->>C: 200 {accessToken, user}

    C->>API: POST /pedidos {canalPedido, unidadeId, itens, formaPagamento}
    API->>DB: Verifica unidade existe
    API->>DB: Verifica produtos existem
    API->>DB: Verifica estoque suficiente
    API->>DB: Decrementa estoque
    API->>DB: Cria pedido (status: AGUARDANDO_PAGAMENTO)
    API->>DB: Cria itens do pedido
    API->>DB: Registra audit log (PEDIDO_CRIADO)
    API-->>C: 201 {pedidoId, status, total, itens}

    C->>API: POST /pagamentos/{pedidoId}/processar
    API->>DB: Busca pedido (valida status)
    API->>GW: Envia pagamento {pedidoId, valor, forma}
    
    alt Pagamento Aprovado
        GW-->>API: {success: true, status: APROVADO, transactionId}
        API->>DB: Registra pagamento (APROVADO)
        API->>DB: Atualiza pedido → PAGO
        API->>DB: Registra audit log (PAGAMENTO_APROVADO)
        API-->>C: 200 {status: APROVADO, statusPedido: PAGO}
    else Pagamento Recusado
        GW-->>API: {success: false, status: RECUSADO, motivo}
        API->>DB: Registra pagamento (RECUSADO)
        API->>DB: Registra audit log (PAGAMENTO_RECUSADO)
        API-->>C: 200 {status: RECUSADO, statusPedido: AGUARDANDO_PAGAMENTO}
    end

    Note over C,API: Fluxo de preparo (Cozinha/Atendente)

    C->>API: PATCH /pedidos/{id}/status {status: EM_PREPARO}
    API->>DB: Valida transição (PAGO → EM_PREPARO ✓)
    API->>DB: Atualiza status
    API->>DB: Registra audit log (STATUS_ATUALIZADO)
    API-->>C: 200 {statusAnterior: PAGO, statusAtual: EM_PREPARO}

    C->>API: PATCH /pedidos/{id}/status {status: PRONTO}
    API->>DB: Atualiza status
    API-->>C: 200 {statusAnterior: EM_PREPARO, statusAtual: PRONTO}

    C->>API: PATCH /pedidos/{id}/status {status: ENTREGUE}
    API->>DB: Atualiza status
    API->>DB: Acumula pontos fidelidade (se consentimento)
    API->>DB: Registra histórico fidelidade
    API-->>C: 200 {statusAnterior: PRONTO, statusAtual: ENTREGUE}
```

---

## 5. Diagrama de Arquitetura (Camadas)

```mermaid
graph TB
    subgraph Clientes
        APP["App Mobile"]
        WEB["Web Browser"]
        TOTEM["Totem"]
    end

    subgraph API_Layer["API Layer - Controllers e Routes"]
        R_AUTH["auth"]
        R_USR["usuarios"]
        R_UNI["unidades"]
        R_PROD["produtos"]
        R_EST["estoque"]
        R_PED["pedidos"]
        R_PGTO["pagamentos"]
        R_FID["fidelidade"]
    end

    subgraph Middlewares
        JWT["Auth JWT"]
        ROLE["Autorizacao Roles"]
        AUDIT["Auditoria"]
        ERR["Error Handler"]
    end

    subgraph Application_Layer["Application Layer - Services"]
        AS["AuthService"]
        PS["PedidoService"]
        PGS["PagamentoService"]
        ES["EstoqueService"]
        FS["FidelidadeService"]
        PRS["ProdutoService"]
    end

    subgraph Domain_Layer["Domain Layer - Enums e Regras"]
        CP["CanalPedido"]
        SP["StatusPedido"]
        RL["Roles"]
        FP["FormaPagamento"]
    end

    subgraph Infrastructure_Layer["Infrastructure Layer"]
        ORM["Sequelize ORM"]
        MOCK["Gateway Mock"]
        DB[("PostgreSQL")]
    end

    APP --> R_AUTH
    WEB --> R_AUTH
    TOTEM --> R_PED

    R_AUTH --> JWT
    R_PED --> JWT
    JWT --> ROLE
    ROLE --> AUDIT

    R_AUTH --> AS
    R_PED --> PS
    R_PGTO --> PGS
    R_EST --> ES
    R_FID --> FS
    R_PROD --> PRS

    PS --> CP
    PS --> SP
    PS --> FP

    AS --> ORM
    PS --> ORM
    ES --> ORM
    PGS --> MOCK
    PGS --> ORM
    FS --> ORM

    ORM --> DB
```
