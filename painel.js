const STATUS_PEDIDO = ['enviado', 'confirmado', 'entregue', 'cancelado'];

let lojaAtual = null;

async function iniciarPainel() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    mostrarArea(false);
    return;
  }

  const { data, error } = await db
    .from('lojas')
    .select('id, nome, whatsapp')
    .eq('dono_id', user.id)
    .single();

  if (error || !data) {
    alert('Este usuário não tem loja cadastrada.');
    await sair();
    return;
  }

  lojaAtual = data;
  document.querySelector('header h1').textContent = `Painel: ${data.nome}`;
  mostrarArea(true);
  carregarProdutos();
  carregarPedidos();
}

async function entrar(email, senha) {
  const { error } = await db.auth.signInWithPassword({ email, password: senha });
  if (error) {
    alert('Não foi possível entrar: ' + error.message);
    return;
  }
  await iniciarPainel();
}

async function sair() {
  await db.auth.signOut();
  lojaAtual = null;
  mostrarArea(false);
}

function mostrarArea(logado) {
  document.getElementById('login').hidden = logado;
  document.getElementById('area-lojista').hidden = !logado;
  document.getElementById('btn-sair').hidden = !logado;
}

// ---------- PRODUTOS ----------

async function carregarProdutos() {
  const { data, error } = await db
    .from('produtos')
    .select('id, nome, descricao, preco, categoria, ativo')
    .eq('loja_id', lojaAtual.id)
    .order('categoria')
    .order('nome');

  if (error) {
    alert('Erro ao carregar produtos: ' + error.message);
    return;
  }
  renderizarProdutos(data);
}

function renderizarProdutos(produtos) {
  const area = document.getElementById('lista-produtos');
  area.innerHTML = '';

  produtos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'produto';

    const info = document.createElement('p');
    info.textContent =
      `${p.nome} (${p.categoria || 'sem categoria'}) — R$ ${Number(p.preco).toFixed(2)} — ${p.ativo ? 'ativo' : 'inativo'}`;

    const btnAtivo = document.createElement('button');
    btnAtivo.textContent = p.ativo ? 'Desativar' : 'Ativar';
    btnAtivo.addEventListener('click', () => alternarAtivo(p.id, !p.ativo));

    const btnApagar = document.createElement('button');
    btnApagar.textContent = 'Apagar';
    btnApagar.addEventListener('click', () => apagarProduto(p.id));

    div.append(info, btnAtivo, btnApagar);
    area.appendChild(div);
  });
}

async function adicionarProduto(e) {
  e.preventDefault();

  const { error } = await db.from('produtos').insert({
    loja_id: lojaAtual.id,
    nome: document.getElementById('prod-nome').value,
    descricao: document.getElementById('prod-descricao').value || null,
    preco: Number(document.getElementById('prod-preco').value),
    categoria: document.getElementById('prod-categoria').value || null,
    ativo: true
  });

  if (error) {
    alert('Erro ao salvar: ' + error.message);
    return;
  }
  e.target.reset();
  carregarProdutos();
}

async function alternarAtivo(id, novoValor) {
  const { error } = await db.from('produtos').update({ ativo: novoValor }).eq('id', id);
  if (error) alert('Erro ao atualizar: ' + error.message);
  carregarProdutos();
}

async function apagarProduto(id) {
  if (!confirm('Apagar este produto?')) return;

  const { error } = await db.from('produtos').delete().eq('id', id);
  if (error) alert('Erro ao apagar: ' + error.message);
  carregarProdutos();
}

// ---------- PEDIDOS ----------

async function carregarPedidos() {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const { data, error } = await db
    .from('pedidos')
    .select('id, cliente_nome, cliente_telefone, endereco, forma_pagamento, total, status, criado_em, pedido_itens(nome_produto, quantidade, preco_unitario)')
    .eq('loja_id', lojaAtual.id)
    .gte('criado_em', inicioDoDia.toISOString())
    .order('criado_em', { ascending: false });

  if (error) {
    alert('Erro ao carregar pedidos: ' + error.message);
    return;
  }
  renderizarPedidos(data);
}

function renderizarPedidos(pedidos) {
  const area = document.getElementById('lista-pedidos');
  area.innerHTML = '';

  if (pedidos.length === 0) {
    area.textContent = 'Nenhum pedido hoje.';
    return;
  }

  pedidos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'produto';

    const hora = new Date(p.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const titulo = document.createElement('p');
    titulo.textContent = `${hora} — ${p.cliente_nome} (${p.cliente_telefone}) — R$ ${Number(p.total).toFixed(2)}`;

    const itens = document.createElement('ul');
    (p.pedido_itens || []).forEach(i => {
      const li = document.createElement('li');
      li.textContent = `${i.quantidade}x ${i.nome_produto}`;
      itens.appendChild(li);
    });

    const detalhes = document.createElement('p');
    detalhes.textContent = `Endereço: ${p.endereco || '—'} | Pagamento: ${p.forma_pagamento || '—'}`;

    const select = document.createElement('select');
    STATUS_PEDIDO.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === p.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => alterarStatus(p.id, select.value));

    div.append(titulo, itens, detalhes, select);
    area.appendChild(div);
  });
}

async function alterarStatus(id, novoStatus) {
  const { error } = await db.from('pedidos').update({ status: novoStatus }).eq('id', id);
  if (error) alert('Erro ao atualizar status: ' + error.message);
  carregarPedidos();
}

// ---------- EVENTOS ----------

document.getElementById('form-login').addEventListener('submit', e => {
  e.preventDefault();
  entrar(
    document.getElementById('email').value,
    document.getElementById('senha').value
  );
});

document.getElementById('form-produto').addEventListener('submit', adicionarProduto);
document.getElementById('btn-sair').addEventListener('click', sair);
document.getElementById('btn-atualizar-pedidos').addEventListener('click', carregarPedidos);

// Se o lojista já estiver logado ao abrir a página, o painel abre direto.
iniciarPainel();