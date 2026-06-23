const fs = require('fs');
const https = require('https');
const path = require('path');

const images = [
    { name: 'logo.png', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2025/07/logo-detalie.png' },
    { name: 'hero.webp', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/08/capa-N.webp' },
    { name: 'cozinha.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/cz.jpg' },
    { name: 'painel-ripado.webp', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/pexels-photo-745119-1.webp' },
    { name: 'dormitorio.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/quarto.jpg' },
    { name: 'espaco-gourmet.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/cozis.jpg' },
    { name: 'banheiro.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/banh.jpg' },
    { name: 'lavanderia.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/as.jpg' },
    { name: 'closet.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/cl.jpg' },
    { name: 'home-office.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/homme.jpg' },
    { name: 'corporativo.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/os.jpg' },
    { name: 'ambientes-personalizados.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/home-servicos.jpg' },
    { name: 'cabeceira-cama.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/hporta-de-correr.jpg' },
    { name: 'painel-tv.jpg', url: 'https://detaliemoveissobmedida.com.br/wp-content/uploads/2023/05/sALA.jpg' }
];

const destFolder = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(destFolder)){
    fs.mkdirSync(destFolder, { recursive: true });
}

images.forEach(img => {
    const dest = path.join(destFolder, img.name);
    const file = fs.createWriteStream(dest);
    https.get(img.url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            console.log(`Downloaded ${img.name}`);
        });
    }).on('error', function(err) {
        fs.unlink(dest, () => {});
        console.error(`Error downloading ${img.name}: ${err.message}`);
    });
});
