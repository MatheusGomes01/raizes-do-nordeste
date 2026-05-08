const { Produto, Estoque, Unidade } = require('../../infrastructure/database/models');
const { AppError } = require('../../api/middlewares/errorHandler');

/**
 * Serviço de Produtos — CRUD e consulta de cardápio por unidade.
 */
class ProdutoService {
  /**
   * Lista todos os produtos (cardápio geral) com paginação.
   */
  async listar({ page = 1, limit = 10, categoria }) {
    const offset = (page - 1) * limit;
    const where = { ativo: true };
    if (categoria) where.categoria = categoria;

    const { count, rows } = await Produto.findAndCountAll({
      where,
      order: [['nome', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Consulta cardápio por unidade (produtos com estoque > 0).
   */
  async cardapioPorUnidade(unidadeId) {
    const unidade = await Unidade.findByPk(unidadeId);
    if (!unidade) {
      throw new AppError('Unidade não encontrada.', 404, 'UNIDADE_NAO_ENCONTRADA');
    }

    const estoque = await Estoque.findAll({
      where: { unidade_id: unidadeId },
      include: [{
        model: Produto,
        as: 'produto',
        where: { ativo: true },
        attributes: ['id', 'nome', 'descricao', 'preco', 'categoria', 'imagem_url']
      }],
      order: [[{ model: Produto, as: 'produto' }, 'categoria', 'ASC']]
    });

    return {
      unidade: { id: unidade.id, nome: unidade.nome, cidade: unidade.cidade },
      cardapio: estoque.map(e => ({
        ...e.produto.toJSON(),
        disponivel: e.quantidade > 0,
        estoque: e.quantidade
      }))
    };
  }

  /**
   * Busca produto por ID.
   */
  async buscarPorId(id) {
    const produto = await Produto.findByPk(id);
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404, 'PRODUTO_NAO_ENCONTRADO');
    }
    return produto;
  }

  /**
   * Cria um novo produto.
   */
  async criar({ nome, descricao, preco, categoria, imagem_url }) {
    if (!nome || !preco || !categoria) {
      throw new AppError('Nome, preço e categoria são obrigatórios.', 422, 'CAMPOS_OBRIGATORIOS', [
        ...(!nome ? [{ field: 'nome', issue: 'Campo obrigatório' }] : []),
        ...(!preco ? [{ field: 'preco', issue: 'Campo obrigatório' }] : []),
        ...(!categoria ? [{ field: 'categoria', issue: 'Campo obrigatório' }] : [])
      ]);
    }

    if (preco <= 0) {
      throw new AppError('Preço deve ser maior que zero.', 422, 'PRECO_INVALIDO', [
        { field: 'preco', issue: 'Deve ser um valor positivo.' }
      ]);
    }

    const produto = await Produto.create({ nome, descricao, preco, categoria, imagem_url });
    return produto;
  }

  /**
   * Atualiza um produto.
   */
  async atualizar(id, dados) {
    const produto = await Produto.findByPk(id);
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404, 'PRODUTO_NAO_ENCONTRADO');
    }

    await produto.update(dados);
    return produto;
  }

  /**
   * Desativa um produto (soft delete).
   */
  async desativar(id) {
    const produto = await Produto.findByPk(id);
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404, 'PRODUTO_NAO_ENCONTRADO');
    }

    await produto.update({ ativo: false });
    return { message: 'Produto desativado com sucesso.' };
  }
}

module.exports = new ProdutoService();
