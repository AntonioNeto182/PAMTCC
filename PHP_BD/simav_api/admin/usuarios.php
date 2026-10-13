<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\admin\usuarios.php
// Lista/busca usuários e permite editar nome, e-mail, papel e status.
// =====================================================================
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('GET', 'POST');

$eu = exigirPermissao($conn, 'usuario.visualizar');

const PAPEIS_VALIDOS = [1, 2, 3];
const POR_PAGINA     = 20;

function formatarUsuarioAdmin(array $u): array
{
    return [
        'id_usuario'          => (int) $u['id_usuario'],
        'nome'                => $u['nome'],
        'email'               => $u['email'],
        'foto_perfil'         => $u['foto_perfil'],
        'id_papel'            => (int) $u['id_papel'],
        'papel'               => $u['papel'],
        'ativo'               => (bool) $u['ativo'],
        'email_verificado'    => $u['email_verificado_em'] !== null,
        'telefone_verificado' => $u['telefone_verificado_em'] !== null,
        'ultimo_acesso'       => $u['ultimo_acesso'],
        'created_at'          => $u['created_at'],
    ];
}

// ---------------------------------------------------------------- GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $busca   = trim((string) ($_GET['busca'] ?? ''));
    $idPapel = inteiroPositivo($_GET['id_papel'] ?? null);
    $ativo   = (string) ($_GET['ativo'] ?? '');

    [$pagina, $limite, $deslocamento] = paginacao(POR_PAGINA);

    $filtros = [];
    $params  = [];

    if ($busca !== '') {
        if (mb_strlen($busca) > 150) {
            falhar(400, 'Busca muito longa');
        }
        $like = '%' . addcslashes($busca, '%_\\') . '%';
        $filtros[] = '(u.nome LIKE ? OR u.email = ?)';
        $params[]  = $like;
        $params[]  = strtolower($busca);
    }
    if ($idPapel !== null) {
        $filtros[] = 'u.id_papel = ?';
        $params[]  = $idPapel;
    }
    if ($ativo === '1' || $ativo === '0') {
        $filtros[] = 'u.ativo = ?';
        $params[]  = (int) $ativo;
    }

    $where = $filtros ? 'WHERE ' . implode(' AND ', $filtros) : '';

    $linhas = consulta(
        $conn,
        "SELECT u.id_usuario, u.nome, u.email, u.foto_perfil, u.id_papel, p.nome AS papel,
                u.ativo, u.email_verificado_em, u.telefone_verificado_em,
                u.ultimo_acesso, u.created_at
         FROM usuarios u
         INNER JOIN papeis p ON p.id_papel = u.id_papel
         $where
         ORDER BY u.ativo DESC, u.nome
         LIMIT ? OFFSET ?",
        [...$params, $limite, $deslocamento]
    );

    [$itens, $temMais] = cortarPagina($linhas, POR_PAGINA);
    $itens = array_map('formatarUsuarioAdmin', $itens);

    $papeis = consulta($conn, 'SELECT id_papel, nome FROM papeis WHERE ativo = 1 ORDER BY id_papel');
    foreach ($papeis as &$p) {
        $p['id_papel'] = (int) $p['id_papel'];
    }
    unset($p);

    echo json_encode([
        'success'     => true,
        'itens'       => $itens,
        'tem_mais'    => $temMais,
        'pagina'      => $pagina,
        'papeis'      => $papeis,
        'pode_editar' => temPermissao($eu, 'usuario.editar'),
    ]);
    exit;
}

// ---------------------------------------------------------------- POST
$editor = exigirPermissao($conn, 'usuario.editar');
$dados  = corpoJson();
$acao   = (string) ($dados['acao'] ?? '');
$id     = inteiroPositivo($dados['id_usuario'] ?? null) ?? falhar(400, 'Usuário obrigatório');

$alvo = consulta(
    $conn,
    'SELECT id_usuario, id_papel, ativo, email FROM usuarios WHERE id_usuario = ?',
    [$id]
)[0] ?? falhar(404, 'Usuário não encontrado');

$souEu = $id === $eu['id_usuario'];

switch ($acao) {
    case 'alternar_ativo':
        if ($souEu) {
            falhar(400, 'Você não pode desativar a própria conta');
        }
        executar($conn, 'UPDATE usuarios SET ativo = NOT ativo WHERE id_usuario = ?', [$id]);
        break;

    case 'editar':
        $nome    = textoObrigatorio($dados['nome'] ?? null, 100, 'Nome');
        $email   = strtolower(trim((string) ($dados['email'] ?? '')));
        $idPapel = inteiroPositivo($dados['id_papel'] ?? null);

        if (strlen($email) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            falhar(400, 'E-mail inválido');
        }
        if ($idPapel !== null) {
            if (!in_array($idPapel, PAPEIS_VALIDOS, true)) {
                falhar(400, 'Papel inválido');
            }
            if (!consulta($conn, 'SELECT 1 FROM papeis WHERE id_papel = ? AND ativo = 1', [$idPapel])) {
                falhar(404, 'Papel não encontrado');
            }
            if ($souEu && $idPapel !== (int) $alvo['id_papel']) {
                falhar(400, 'Você não pode alterar o próprio papel');
            }
        }

        $mudouEmail = $email !== $alvo['email'];
        $sets       = ['nome = ?', 'email = ?'];
        $params     = [$nome, $email];

        if ($mudouEmail) {
            $sets[] = 'email_verificado_em = NULL';
        }
        if ($idPapel !== null) {
            $sets[]   = 'id_papel = ?';
            $params[] = $idPapel;
        }
        $params[] = $id;

        try {
            executar($conn, 'UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id_usuario = ?', $params);
        } catch (mysqli_sql_exception $e) {
            if ($e->getCode() === 1062) {
                falhar(409, 'E-mail já cadastrado em outra conta');
            }
            throw $e;
        }
        break;

    default:
        falhar(400, 'Ação inválida');
}

$usuario = consulta(
    $conn,
    'SELECT u.id_usuario, u.nome, u.email, u.foto_perfil, u.id_papel, p.nome AS papel,
            u.ativo, u.email_verificado_em, u.telefone_verificado_em,
            u.ultimo_acesso, u.created_at
     FROM usuarios u INNER JOIN papeis p ON p.id_papel = u.id_papel
     WHERE u.id_usuario = ?',
    [$id]
)[0];

echo json_encode(['success' => true, 'usuario' => formatarUsuarioAdmin($usuario)]);