// Envio do pedido: grava no Supabase e abre o WhatsApp da loja com a mensagem pronta.
// Usa as variáveis "carrinho", "atualizarCarrinho" e "LOJA_ID" do catalogo.js.

function montarMensagem(itens, cliente, total, codigo) {
  const linhas = itens.map(i =>
    `${i.quantidade}x ${i.nome} - R$ ${(i.preco * i.quantidade).toFixed(2)}`
  );

  return [
    `Novo pedido #${codigo}`,
    ...linhas,
    `Total: R$ ${total.toFixed(2)}`,
    `Cliente: ${cliente.nome}`,
    `Telefone: ${cliente.telefone}`,
    `Endereço: ${cliente.endereco}`,
    `Pagamento: ${cliente.pagamento}`
  ].join('\n');
}

function lerDadosDoCliente() {
  return {
    nome: document.getElementById('cli-nome').value.trim(),
    telefone: document.getElementById('cli-telefone').value.trim(),
    endereco: document.getElementById('cli-endereco').value.trim(),
    pagamento: document.getElementById('cli-pagamento').value
  };
}

async function enviarPedido() {
  if (carrinho.length === 0) return;

  const cliente = lerDadosDoCliente();
  if (!cliente.nome || !cliente.telefone || !cliente.endereco) {
    alert('Preencha nome, telefone e endereço para enviar o pedido.');
    return;
  }

  const botao = document.getElementById('btn-enviar');
  botao.disabled = true;

  // Abre a aba agora, dentro do clique, para o navegador não bloquear a janela.
  const janela = window.open('about:blank', '_blank');

  const total = calcularTotal();
  const pedidoId = crypto.randomUUID();

  // 1. Grava o pedido. O cliente não pode ler a tabela, então não usamos .select().
  const { error: erroPedido } = await db.from('pedidos').insert({
    id: pedidoId,
    loja_id: LOJA_ID,
    cliente_nome: cliente.nome,
    cliente_telefone: cliente.telefone,
    endereco: cliente.endereco,
    forma_pagamento: cliente.pagamento,
    total: total
  });

  if (erroPedido) {
    if (janela) janela.close();
    alert('Não foi possível enviar o pedido: ' + erroPedido.message);
    botao.disabled = false;
    return;
  }

  // 2. Grava os itens do pedido.
  const itens = carrinho.map(i => ({
    pedido_id: pedidoId,
    produto_id: i.id,
    nome_produto: i.nome,
    quantidade: i.quantidade,
    preco_unitario: i.preco
  }));

  const { error: erroItens } = await db.from('pedido_itens').insert(itens);
  if (erroItens) {
    if (janela) janela.close();
    alert('O pedido foi registrado, mas houve erro nos itens: ' + erroItens.message);
    botao.disabled = false;
    return;
  }

  // 3. Busca o WhatsApp da loja e abre a conversa com a mensagem pronta.
  const { data: loja, error: erroLoja } = await db
    .from('lojas')
    .select('whatsapp')
    .eq('id', LOJA_ID)
    .single();

  if (erroLoja || !loja) {
    if (janela) janela.close();
    alert('Pedido registrado, mas não foi possível abrir o WhatsApp da loja.');
    botao.disabled = false;
    return;
  }

  const codigo = pedidoId.slice(0, 8);
  const mensagem = montarMensagem(carrinho, cliente, total, codigo);
  const url = `https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(mensagem)}`;

  if (janela) {
    janela.location.href = url;
  } else {
    window.location.href = url;
  }

  // 4. Limpa o carrinho e o formulário.
  carrinho = [];
  atualizarCarrinho();
  ['cli-nome', 'cli-telefone', 'cli-endereco'].forEach(id => {
    document.getElementById(id).value = '';
  });
  botao.disabled = false;
}

document.getElementById('btn-enviar').addEventListener('click', enviarPedido);