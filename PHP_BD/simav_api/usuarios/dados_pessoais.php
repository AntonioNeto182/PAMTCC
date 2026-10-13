<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

exigirMetodo('GET', 'POST');

$eu = exigirLogin($conn);

function dadosDoUsuario(mysqli $conn, int $id): array
{
    $u = consulta(
        $conn,
        'SELECT cpf, data_nascimento, telefone, email, email_verificado_em, telefone_verificado_em
         FROM usuarios WHERE id_usuario = ?',
        [$id]
    )[0];

    return [
        'cpf_mascarado'        => mascararCpf($u['cpf']),
        'tem_cpf'              => $u['cpf'] !== null,
        'data_nascimento'      => $u['data_nascimento'],
        'telefone'             => $u['telefone'],
        'email'                => $u['email'],
        'email_verificado'     => $u['email_verificado_em'] !== null,
        'telefone_verificado'  => $u['telefone_verificado_em'] !== null,
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dados = corpoJson();
    $sets  = [];
    $par   = [];

    // Só altera o que veio no corpo: campo ausente = mantém; string vazia = limpa
    if (array_key_exists('cpf', $dados)) {
        $cpf    = normalizarCpf($dados['cpf']);
        $sets[] = 'cpf = ?';
        $par[]  = $cpf;
    }
    if (array_key_exists('data_nascimento', $dados)) {
        $sets[] = 'data_nascimento = ?';
        $par[]  = normalizarNascimento($dados['data_nascimento']);
    }
    if (array_key_exists('telefone', $dados)) {
        $novo   = normalizarTelefone($dados['telefone']);
        $atual  = consulta($conn, 'SELECT telefone FROM usuarios WHERE id_usuario = ?', [$eu['id_usuario']])[0]['telefone'];
        $sets[] = 'telefone = ?';
        $par[]  = $novo;
        if ($novo !== $atual) {
            $sets[] = 'telefone_verificado_em = NULL';
        }
    }
    if (!$sets) {
        falhar(400, 'Nada para atualizar');
    }

    $par[] = $eu['id_usuario'];

    try {
        executar($conn, 'UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id_usuario = ?', $par);
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() === 1062) {
            falhar(409, 'CPF já cadastrado em outra conta');
        }
        throw $e;
    }
}

echo json_encode(['success' => true] + dadosDoUsuario($conn, $eu['id_usuario']));
