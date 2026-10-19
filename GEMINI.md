# Diretrizes do Projeto - Sincronização Automática com GitHub

## Sincronização com o Git / GitHub (Regra Mandatória)

1. **Início de Sessão / Primeira Mensagem no Workspace:**
   - Se o projeto for um repositório Git:
     - O assistente DEVE verificar proativamente o repositório remoto executando `git fetch origin`.
     - Se o PC local estiver mais antigo (atrás da branch remota, ex: `origin/main` ou `origin/master`), o assistente DEVE rodar `git pull` automaticamente para que o computador fique 100% atualizado antes de qualquer tarefa.
     - Informar de forma breve e discreta que o PC local está sincronizado com o GitHub.

2. **Finalização de Tarefas / Alterações de Código:**
   - Sempre que o assistente fizer modificações ou melhorias no projeto, DEVE automaticamente realizar o `git add .`, `git commit` com mensagem descritiva e `git push` para a branch ativa do repositório remoto.
   - O usuário NUNCA deve precisar lembrar de pedir "atualize o github" nem "atualize o pc local".
