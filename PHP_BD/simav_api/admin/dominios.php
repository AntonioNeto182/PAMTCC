<?php
include('../config/cors.php');
include('../config/database.php');
include('../config/auth.php');
include('../config/util.php');

/**
 * Domínios editáveis. Nomes de tabela e coluna vêm só desta lista (nunca da requisição).
 * Status e resultados são lidos por triggers/procedures pelo NOME, por isso só podem ser
 * editados (descrição, cor, ordem), não criados nem excluídos.
 */
const DOMINIOS = [
    'tipos' => [
        'rotulo' => 'Tipos de denúncia', 'tabela' => 'tipos_denuncia', 'pk' => 'id_tipo',
        'ativo' => true, 'criar' => true, 'excluir' => true,
        'campos' => [
            'nome'      => ['rotulo' => 'Nome', 'tipo' => 'texto', 'max' => 100, 'obrigatorio' => true],
            'descricao' => ['rotulo' => 'Descrição', 'tipo' => 'texto', 'max' => 255],
        ],
    ],
    'arboviroses' => [
        'rotulo' => 'Arboviroses', 'tabela' => 'arboviroses', 'pk' => 'id_arbovirose',
        'ativo' => true, 'criar' => true, 'excluir' => true,
        'campos' => [
            'nome'      => ['rotulo' => 'Nome', 'tipo' => 'texto', 'max' => 100, 'obrigatorio' => true],
            'descricao' => ['rotulo' => 'Descrição', 'tipo' => 'texto', 'max' => 255],
        ],
    ],
    'status_denuncia' => [
        'rotulo' => 'Status de denúncia', 'tabela' => 'status_denuncia', 'pk' => 'id_status',
        'ativo' => false, 'criar' => false, 'excluir' => false,
        'campos' => [
            'descricao' => ['rotulo' => 'Descrição', 'tipo' => 'texto', 'max' => 255],
            'cor'       => ['rotulo' => 'Cor (#RRGGBB)', 'tipo' => 'cor', 'max' => 20, 'obrigatorio' => true],
            'ordem'     => ['rotulo' => 'Ordem', 'tipo' => 'inteiro', 'min' => 1, 'max' => 255, 'obrigatorio' => true],
        ],
    ],
    'status_foco' => [
        'rotulo' => 'Status de foco', 'tabela' => 'status_foco', 'pk' => 'id_status',
        'ativo' => false, 'criar' => false, 'excluir' => false,
        'campos' => [
            'descricao' => ['rotulo' => 'Descrição', 'tipo' => 'texto', 'max' => 255],
        ],
    ],
    'resultado_vistoria' => [
        'rotulo' => 'Resultados de vistoria', 'tabela' => 'resultado_vistoria', 'pk' => 'id_resultado',
        'ativo' => false, 'criar' => false, 'excluir' => false,
        'campos' => [
            'descricao' => ['rotulo' => 'Descrição', 'tipo' => 'texto', 'max' => 255],
        ],
    ],
];

function valorDoCampo(string $campo, array $def, mixed $bruto): string|int|null
{
    return match ($def['tipo']) {
        'inteiro' => (static function () use ($bruto, $def, $campo): int {
            $n = filter_var($bruto, FILTER_VALIDATE_INT);
            if ($n === false || $n < $def['min'] || $n > $def['max']) {
                falhar(400, "{$def['rotulo']} inválido");
            }
            return $n;
        })(),
        'cor' => preg_match('/^#[0-9a-fA-F]{6}$/', (string) $bruto)
            ? strtolower((string) $bruto)
            : falhar(400, 'Cor inválida (use #RRGGBB)'),
        default => ($def['obrigatorio'] ?? false)
            ? textoObrigatorio($bruto, $def['max'], $def['rotulo'])
            : textoOpcional($bruto, $def['max'], $def['rotulo']),
    };
}

$eu = exigirPermissao($conn, 'configuracao.editar');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $saida = [];

    foreach (DOMINIOS as $chave => $d) {
        $colunas = array_merge([$d['pk']], ['nome'], array_keys($d['campos']), $d['ativo'] ? ['ativo'] : []);
        $colunas = array_values(array_unique($colunas));
        $ordem   = isset($d['campos']['ordem']) ? 'ordem, ' . $d['pk'] : 'nome';

        $itens = consulta($conn, 'SELECT ' . implode(', ', $colunas) . " FROM {$d['tabela']} ORDER BY $ordem");

        foreach ($itens as &$i) {
            $i['id'] = (int) $i[$d['pk']];
            if ($d['ativo']) {
                $i['ativo'] = (bool) $i['ativo'];
            }
            if (isset($i['ordem'])) {
                $i['ordem'] = (int) $i['ordem'];
            }
            unset($i[$d['pk']]);
        }
        unset($i);

        $saida[] = [
            'chave'         => $chave,
            'rotulo'        => $d['rotulo'],
            'editar_nome'   => $d['criar'], // nomes de status são usados por triggers
            'pode_criar'    => $d['criar'],
            'pode_alternar' => $d['ativo'],
            'pode_excluir'  => $d['excluir'],
            'campos'        => array_map(
                static fn(string $k, array $c): array => ['nome' => $k, 'rotulo' => $c['rotulo'], 'tipo' => $c['tipo']],
                array_keys($d['campos']),
                $d['campos']
            ),
            'itens'         => $itens,
        ];
    }

    echo json_encode(['success' => true, 'dominios' => $saida]);
    exit;
}

exigirMetodo('POST');

$dados = corpoJson();
$d     = DOMINIOS[(string) ($dados['dominio'] ?? '')] ?? falhar(400, 'Domínio inválido');
$acao  = (string) ($dados['acao'] ?? 'salvar');
$id    = inteiroPositivo($dados['id'] ?? null);

try {
    if ($acao === 'excluir') {
        if (!$d['excluir']) {
            falhar(403, 'Este domínio não permite exclusão');
        }
        $id ?? falhar(400, 'Dados incompletos');
        executar($conn, "DELETE FROM {$d['tabela']} WHERE {$d['pk']} = ?", [$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($acao === 'alternar') {
        if (!$d['ativo']) {
            falhar(403, 'Este domínio não permite desativação');
        }
        $id ?? falhar(400, 'Dados incompletos');
        executar($conn, "UPDATE {$d['tabela']} SET ativo = NOT ativo WHERE {$d['pk']} = ?", [$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    $campos = $d['campos'];
    if ($d['criar']) {
        $campos = ['nome' => ['rotulo' => 'Nome', 'tipo' => 'texto', 'max' => 100, 'obrigatorio' => true]] + $campos;
    }

    $valores = [];
    foreach ($campos as $nome => $def) {
        $valores[$nome] = valorDoCampo($nome, $def, $dados[$nome] ?? null);
    }

    if ($id === null) {
        if (!$d['criar']) {
            falhar(403, 'Este domínio não permite criação');
        }
        $cols = array_keys($valores);
        executar(
            $conn,
            "INSERT INTO {$d['tabela']} (" . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')',
            array_values($valores)
        );
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
        exit;
    }

    $sets = implode(', ', array_map(static fn(string $c): string => "$c = ?", array_keys($valores)));
    executar($conn, "UPDATE {$d['tabela']} SET $sets WHERE {$d['pk']} = ?", [...array_values($valores), $id]);
    echo json_encode(['success' => true, 'id' => $id]);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        falhar(409, 'Já existe um registro com este nome');
    }
    if ($e->getCode() === 1451) {
        falhar(409, 'Registro em uso; desative-o em vez de excluir');
    }
    throw $e;
}
