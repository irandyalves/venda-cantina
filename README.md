# 🍕 Cantina Express — Sistema Online de Vendas, Cozinha (KDS) & Painel TV

Sistema web de alta performance desenvolvido para cantinas, lanchonetes e pizzarias com foco em **agilidade operacional sem intermediários** (sem carrinho, cliques diretos).

---

## 🚀 Principais Módulos

### 1. 🛒 Caixa (PDV de Balcão Ágil) — `URL: /#caixa`
- **Identificação do Cliente**: Campo de digitação rápida do nome da pessoa.
- **Seção Pizza**:
  - Botões diretos com os sabores (Margueritta, Gourvê/Gourmet, Calabresa, 4 Queijos, Frango c/ Catupiry...).
  - Ao clicar no sabor, abre imediatamente os botões **PEDAÇO** ou **INTEIRA** com preços calculados.
  - Gera numeração automática com prefixo: `P ped-01`, `P ped-02` (pedaço) ou `P int-01` (inteira).
- **Seção Açaí**: Botões com copos e tigelas. Gera comandas automáticas com prefixo `Açaí 01`, `Açaí 02`...
- **Seção Batata Frita**: Botões com porções (Cone, Média, Cheddar & Bacon). Gera comanda `Bat 01`, `Bat 02`...
- **Venda Direta**: Seleciona quantidade, escolhe forma de pagamento (PIX, Dinheiro, Débito, Crédito) e **vai direto para a cozinha**.
- **Rodapé do Caixa**: Contadores em tempo real de pedidos **Em Preparação**, **Prontas** e **Entregues**, além do faturamento total do dia.
- **Engrenagem ⚙️**: Acesso rápido às configurações, cadastro/edição de sabores e fechamento do turno.

### 2. 👨‍🍳 Cozinha & Produção (KDS) — `URL: /#cozinha`
- **Alertas Sonoros Exclusivos**:
  - 🍕 Som característico para Pizza.
  - 🍟 Som característico para Batata Frita.
  - 🍧 Som característico para Açaí.
  - *(Todos gerados nativamente via Web Audio API, sem arquivos externos)*.
- **Chegou o pedido**: entra direto como **Em Preparação**.
- **Cards com cronômetro em tempo real**: indica quanto tempo cada pedido está esperando.
- **Ação 1-Clique**: Botão **[ENTREGAR / DAR OK]** para finalizar a comanda instantaneamente.
- **Módulo Pronto**: Botão para chamar na TV antes de entregar.

### 3. 📺 Painel do Público (TV / Monitor) — `URL: /#tv`
- Tela em modo **Fullscreen** para monitores e Smart TVs voltados ao público.
- **Coluna Em Preparação**: Acompanhamento dos pedidos em produção.
- **Coluna Pronto para Retirada**: Destaque visual pulsante com chime de chamada sonora.
- **Histórico de Pedidos Entregues**: Clientes recém-atendidos.

---

## ⚙️ Conexão Firebase & Nuvem

O sistema possui sincronização dupla:
1. **Sincronização Local Instantânea**: Mesmo sem internet ou antes de configurar o Firebase, as telas sincronizam entre abas no mesmo computador ou rede via `BroadcastChannel`.
2. **Nuvem Firebase Firestore**:
   - Clique no ícone de **Engrenagem ⚙️** no topo do Caixa.
   - Vá na aba **Conexão Firebase** e cole sua `API Key` e `Project ID`.
   - Clique em **Salvar e Conectar ao Firebase**. Pronto! O sistema passa a gravar e sincronizar pela nuvem do seu Firebase.

---

## 🛠️ Como Executar Localmente

1. Instalar as dependências:
   ```bash
   npm install
   ```

2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acessar no navegador:
   - **Caixa**: [http://localhost:5173/#caixa](http://localhost:5173/#caixa)
   - **Cozinha**: [http://localhost:5173/#cozinha](http://localhost:5173/#cozinha)
   - **Painel TV**: [http://localhost:5173/#tv](http://localhost:5173/#tv)

---

## 🌐 Publicação no Firebase Hosting

1. Gerar os arquivos otimizados:
   ```bash
   npm run build
   ```

2. Fazer login no Firebase (se ainda não fez):
   ```bash
   npx firebase login
   ```

3. Fazer o deploy:
   ```bash
   npx firebase deploy
   ```

---

## 🐙 Como Subir para o seu Repositório GitHub

Execute no terminal:
```bash
git init
git add .
git commit -m "feat: Sistema Cantina Express (PDV, Cozinha KDS, Painel TV e Firebase)"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git push -u origin main
```
