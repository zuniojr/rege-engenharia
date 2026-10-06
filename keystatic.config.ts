import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: process.env.NODE_ENV === 'development' ? 'local' : 'github',
    repo: {
      owner: 'zuniojr',
      name: 'rege-engenharia',
    },
  },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/data/posts/*',
      format: 'json',
      schema: {
        title: fields.text({ label: 'Title' }),
        slug: fields.text({ label: 'Slug' }),
        tag: fields.text({ label: 'Tag' }),
        image: fields.image({
          label: 'Capa do Post',
          directory: 'public/images',
          publicPath: '/images',
        }),
        imageAlt: fields.text({ label: 'Alt Text da Imagem' }),
        excerpt: fields.text({ label: 'Resumo', multiline: true }),
        readTime: fields.text({ label: 'Tempo de Leitura' }),
        featured: fields.checkbox({ label: 'Destaque' }),
        content: fields.blocks(
          {
            paragraph: {
              label: 'Parágrafo',
              schema: fields.object({
                text: fields.text({ label: 'Texto', multiline: true }),
              }),
            },
            heading: {
              label: 'Heading (H2)',
              schema: fields.object({
                text: fields.text({ label: 'Texto' }),
              }),
            },
            subheading: {
              label: 'Subheading (H3)',
              schema: fields.object({
                text: fields.text({ label: 'Texto' }),
              }),
            },
            list: {
              label: 'Lista com marcadores',
              schema: fields.object({
                items: fields.array(fields.text({ label: 'Item' }), {
                  label: 'Itens da lista',
                  itemLabel: props => props.value
                }),
              }),
            },
            quote: {
              label: 'Citação',
              schema: fields.object({
                text: fields.text({ label: 'Texto', multiline: true }),
              }),
            },
            code: {
              label: 'Código',
              schema: fields.object({
                text: fields.text({ label: 'Código', multiline: true }),
              }),
            }
          },
          { label: 'Conteúdo' }
        ),
      },
    }),
  },
});
