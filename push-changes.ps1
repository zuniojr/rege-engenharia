Write-Host "Iniciando processo de commit e push das alteracoes do logotipo..." -ForegroundColor Cyan

# Adicionar arquivos alterados
Write-Host "1. Executando 'git add .'..." -ForegroundColor Yellow
git add .

# Criar commit
Write-Host "2. Criando commit com as alteracoes..." -ForegroundColor Yellow
git commit -m "style: atualiza logotipo para o novo formato PNG nos cabecalhos e rodape"

# Enviar para o GitHub
Write-Host "3. Enviando alteracoes para o GitHub..." -ForegroundColor Yellow
git push

Write-Host "Concluido com sucesso!" -ForegroundColor Green
