import http from 'http';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = './src/data/blogPosts.js';
const IMAGES_DIR = './public/images';

// Lê o blogPosts.js como texto e extrai os dados com split seguro
async function getPosts() {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const posts = [];
    
    // Divide o arquivo pelo inicio de cada post
    const blocks = content.split('slug:').slice(1);
    
    for (const block of blocks) {
        const slugMatch = block.match(/^\s*['"]([^'"]+)['"]/);
        const titleMatch = block.match(/title:\s*['"]([^'"]+)['"]/);
        const imageMatch = block.match(/image:\s*['"]([^'"]+)['"]/);
        const tagMatch = block.match(/tag:\s*['"]([^'"]+)['"]/);
        
        if (slugMatch && titleMatch) {
            posts.push({ 
                slug: slugMatch[1], 
                title: titleMatch[1],
                image: imageMatch ? imageMatch[1] : '',
                tag: tagMatch ? tagMatch[1] : 'BLOG'
            });
        }
    }
    return posts.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // ─── Servir imagens estáticas ───────────────────────────────────────────
    if (req.url.startsWith('/images/')) {
        try {
            const imgPath = path.join(process.cwd(), 'public', req.url);
            const imgData = await fs.readFile(imgPath);
            const ext = path.extname(imgPath).toLowerCase();
            const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.avif': 'image/avif',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            return res.end(imgData);
        } catch (err) {
            res.writeHead(404);
            return res.end('Imagem não encontrada');
        }
    }

    // ─── Página principal ───────────────────────────────────────────────────
    if (req.url === '/' && req.method === 'GET') {
        try {
            const posts = await getPosts();
            
            const cardsHtml = posts.map(p => `
                <div class="card" onclick="openModal('${p.slug}', '${p.title.replace(/'/g, "\\'")}', '${p.image}')">
                    <div class="card-image-wrapper">
                        <img src="${p.image || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}" alt="${p.title}" loading="lazy">
                        <div class="edit-overlay">
                            <span>✏️ Trocar Imagem</span>
                        </div>
                    </div>
                    <div class="card-content">
                        <span class="tag">${p.tag}</span>
                        <h2 class="title">${p.title}</h2>
                    </div>
                </div>
            `).join('\n');

            const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciador de Imagens — Regê Engenharia</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            min-height: 100vh;
        }
        header {
            background: #fff;
            padding: 2rem;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        header h1 { font-size: 1.8rem; font-weight: 800; color: #1e293b; }
        header p { color: #64748b; margin-top: 0.5rem; }
        
        main {
            max-width: 1200px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 2rem;
        }
        
        .card {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            border: 1px solid #f1f5f9;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border-color: #cbd5e1;
        }
        
        .card-image-wrapper {
            position: relative;
            width: 100%;
            height: 200px;
            overflow: hidden;
            background: #e2e8f0;
        }
        .card-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        .card:hover .card-image-wrapper img {
            transform: scale(1.05);
        }
        .edit-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        .edit-overlay span {
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 999px;
            backdrop-filter: blur(4px);
        }
        .card:hover .edit-overlay { opacity: 1; }
        
        .card-content {
            padding: 1.5rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        .tag {
            font-size: 0.75rem;
            font-weight: 700;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
        }
        .title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.4;
        }

        /* MODAL */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 1000;
            padding: 1rem;
            backdrop-filter: blur(4px);
        }
        .modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .modal {
            background: #fff;
            border-radius: 16px;
            padding: 2.5rem;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            transform: translateY(20px);
            transition: transform 0.2s ease;
            position: relative;
        }
        .modal-overlay.active .modal {
            transform: translateY(0);
        }
        .close-btn {
            position: absolute;
            top: 1rem; right: 1rem;
            background: none; border: none;
            font-size: 1.5rem; color: #64748b;
            cursor: pointer;
            width: 32px; height: 32px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.2s;
        }
        .close-btn:hover { background: #f1f5f9; color: #0f172a; }
        
        .modal h2 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #0f172a;
        }
        .modal p.subtitle {
            font-size: 0.9rem;
            color: #64748b;
            margin-bottom: 1.5rem;
            line-height: 1.4;
        }
        
        .form-group { margin-bottom: 1.5rem; }
        label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #334155;
        }
        input[type="file"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            font-size: 0.95rem;
            background: #f8fafc;
            color: #0f172a;
            outline: none;
            transition: border 0.2s;
            cursor: pointer;
        }
        input[type="file"]:hover { border-color: #94a3b8; }
        
        #preview-wrap { margin-top: 1rem; display: none; text-align: center; }
        #preview-wrap img { max-height: 160px; border-radius: 8px; border: 1px solid #e2e8f0; }
        
        button[type="submit"] {
            background: #0f172a;
            color: white;
            border: none;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s;
        }
        button[type="submit"]:hover { background: #1e293b; }
        button[type="submit"]:disabled { background: #94a3b8; cursor: not-allowed; }
        
        #message {
            margin-top: 1.25rem;
            padding: 1rem;
            border-radius: 8px;
            display: none;
            text-align: center;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    </style>
</head>
<body>

<header>
    <h1>Blog Regê Engenharia</h1>
    <p>Selecione um post abaixo para alterar a imagem de capa.</p>
</header>

<main>
    <div class="grid">
        ${cardsHtml}
    </div>
</main>

<div class="modal-overlay" id="modalOverlay">
    <div class="modal">
        <button class="close-btn" onclick="closeModal()">&times;</button>
        <h2 id="modalTitle">Título do Post</h2>
        <p class="subtitle" id="modalCurrentImg">Imagem atual: ...</p>
        
        <form id="uploadForm">
            <input type="hidden" id="postSlug">
            
            <div class="form-group">
                <label for="imageFile">Selecione a nova imagem (JPG, PNG, AVIF, WEBP):</label>
                <input type="file" id="imageFile" accept="image/*" required>
                <div id="preview-wrap"><img id="preview" src="" alt="Preview"></div>
            </div>

            <button type="submit" id="submitBtn">Salvar Nova Imagem</button>
        </form>

        <div id="message"></div>
    </div>
</div>

<script>
    const modalOverlay = document.getElementById('modalOverlay');
    const uploadForm = document.getElementById('uploadForm');
    const messageDiv = document.getElementById('message');
    const previewWrap = document.getElementById('preview-wrap');
    const previewImg = document.getElementById('preview');

    function openModal(slug, title, currentImage) {
        document.getElementById('postSlug').value = slug;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalCurrentImg').innerHTML = currentImage ? \`Imagem atual: <strong>\${currentImage}</strong>\` : 'Sem imagem atualmente';
        
        uploadForm.reset();
        previewWrap.style.display = 'none';
        messageDiv.style.display = 'none';
        
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Fechar ao clicar fora
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Preview
    document.getElementById('imageFile').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            previewImg.src = URL.createObjectURL(this.files[0]);
            previewWrap.style.display = 'block';
        } else {
            previewWrap.style.display = 'none';
        }
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn  = document.getElementById('submitBtn');
        const slug = document.getElementById('postSlug').value;
        const file = document.getElementById('imageFile').files[0];

        if (!slug || !file) return;

        btn.disabled = true;
        btn.textContent = 'Enviando…';
        messageDiv.style.display = 'none';

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, filename: file.name, imageBase64: base64 })
                });
                const data = await response.json();
                if (response.ok) {
                    messageDiv.textContent = '✅ Imagem atualizada! Recarregando a página...';
                    messageDiv.className = 'success';
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    messageDiv.textContent = '❌ Erro: ' + data.error;
                    messageDiv.className = 'error';
                    btn.disabled = false;
                    btn.textContent = 'Salvar Nova Imagem';
                }
            } catch(err) {
                messageDiv.textContent = '❌ Erro de rede: ' + err.message;
                messageDiv.className = 'error';
                btn.disabled = false;
                btn.textContent = 'Salvar Nova Imagem';
            }
            messageDiv.style.display = 'block';
        };
    });
</script>
</body>
</html>`;
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(html);
        } catch (err) {
            console.error('Erro ao carregar posts:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Erro ao carregar posts: ' + err.message);
        }
    }

    // ─── Upload e atualização ───────────────────────────────────────────────
    if (req.url === '/upload' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { slug, filename, imageBase64 } = JSON.parse(body);

                if (!slug || !filename || !imageBase64) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Dados incompletos' }));
                }

                // 1. Salvar imagem em public/images/
                const destPath = path.join(IMAGES_DIR, filename);
                await fs.writeFile(destPath, Buffer.from(imageBase64, 'base64'));
                console.log(`✅ Imagem salva em: ${destPath}`);

                // 2. Atualizar blogPosts.js com regex segura
                let content = await fs.readFile(DATA_FILE, 'utf-8');

                const slugPattern = slug.replace(/-/g, '\\-');
                const regex = new RegExp(
                    `(slug:\\s*['"]${slugPattern}['"][\\s\\S]{0,500}?image:\\s*['"])([^'"]+)(['"])`,
                    ''
                );

                if (!regex.test(content)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: `Post com slug "${slug}" não encontrado ou campo image ausente` }));
                }

                const newPath = `/images/${filename}`;
                const updated = content.replace(regex, `$1${newPath}$3`);
                await fs.writeFile(DATA_FILE, updated, 'utf-8');
                console.log(`✅ blogPosts.js atualizado: ${slug} → ${newPath}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Erro no upload:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log('=================================================');
    console.log('🚀 Gerenciador de Imagens do Blog — Regê Engenharia');
    console.log(`➡️  Acesse: http://localhost:${PORT}`);
    console.log('=================================================');
});

