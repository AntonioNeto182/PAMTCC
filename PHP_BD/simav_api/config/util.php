<?php
// =====================================================================
// ARQUIVO: C:\xampp\htdocs\simav_api\config\util.php
// =====================================================================
declare(strict_types=1);

const IMAGEM_MAX_BYTES = 5 * 1024 * 1024;
const IMAGEM_TIPOS     = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const PONTOS_POR_NIVEL = 50;

final class ErroHttp extends RuntimeException
{
    public int $status;

    public function __construct(int $status, string $mensagem)
    {
        parent::__construct($mensagem);
        $this->status = $status;
    }
}

set_exception_handler(static function (Throwable $e): void {
    if ($e instanceof ErroHttp) {
        responder($e->status, ['success' => false, 'message' => $e->getMessage()]);
    }

    if ($e instanceof mysqli_sql_exception) {
        if ($e->getSqlState() === '45000') {
            responder(409, ['success' => false, 'message' => $e->getMessage()]);
        }
        $mapa = [
            1062 => [409, 'Registro já existe'],
            1451 => [409, 'Registro em uso por outros dados'],
            1452 => [404, 'Registro relacionado não encontrado'],
        ];
        if (isset($mapa[$e->getCode()])) {
            responder($mapa[$e->getCode()][0], ['success' => false, 'message' => $mapa[$e->getCode()][1]]);
        }
    }

    error_log($e::class . ': ' . $e->getMessage());
    responder(500, ['success' => false, 'message' => 'Erro interno']);
});

function falhar(int $status, string $mensagem): never
{
    throw new ErroHttp($status, $mensagem);
}

function inteiroPositivo(mixed $valor): ?int
{
    $n = filter_var($valor, FILTER_VALIDATE_INT);
    return ($n !== false && $n > 0) ? $n : null;
}

function textoOpcional(mixed $valor, int $max, string $campo = 'Texto'): ?string
{
    $t = trim((string) ($valor ?? ''));
    if ($t === '') return null;
    if (mb_strlen($t) > $max) falhar(400, "$campo deve ter no máximo $max caracteres");
    return $t;
}

function textoObrigatorio(mixed $valor, int $max, string $campo = 'Texto'): string
{
    return textoOpcional($valor, $max, $campo) ?? falhar(400, "$campo é obrigatório");
}

function entrada(): array
{
    return $_POST ?: corpoJson();
}

function exigirMetodo(string ...$metodos): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', $metodos, true)) {
        falhar(405, 'Método não permitido');
    }
}

function paginacao(int $porPagina = 20): array
{
    $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
    return [$pagina, $porPagina + 1, ($pagina - 1) * $porPagina];
}

function cortarPagina(array $linhas, int $porPagina = 20): array
{
    return [array_slice($linhas, 0, $porPagina), count($linhas) > $porPagina];
}

function somenteDigitos(string $s): string
{
    return preg_replace('/\D+/', '', $s) ?? '';
}

function cpfValido(string $cpf): bool
{
    if (!preg_match('/^\d{11}$/', $cpf) || preg_match('/^(\d)\1{10}$/', $cpf)) return false;
    for ($t = 9; $t < 11; $t++) {
        $soma = 0;
        for ($i = 0; $i < $t; $i++) $soma += (int) $cpf[$i] * ($t + 1 - $i);
        if ((int) $cpf[$t] !== ((10 * $soma) % 11) % 10) return false;
    }
    return true;
}

function normalizarCpf(mixed $valor): ?string
{
    $d = somenteDigitos((string) ($valor ?? ''));
    if ($d === '') return null;
    return cpfValido($d) ? $d : falhar(400, 'CPF inválido');
}

function normalizarTelefone(mixed $valor): ?string
{
    $d = somenteDigitos((string) ($valor ?? ''));
    if ($d === '') return null;
    return preg_match('/^\d{10,15}$/', $d) ? $d : falhar(400, 'Telefone inválido (use DDD + número)');
}

function normalizarNascimento(mixed $valor): ?string
{
    $v = trim((string) ($valor ?? ''));
    if ($v === '') return null;
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
    $hoje = new DateTimeImmutable('today');
    if (!$d || $d->format('Y-m-d') !== $v || $d > $hoje || $d < $hoje->modify('-120 years')) {
        falhar(400, 'Data de nascimento inválida');
    }
    return $v;
}

function mascararCpf(?string $cpf): ?string
{
    return $cpf === null ? null : '•••.•••.•••-' . substr($cpf, -2);
}

function salvarImagem(?array $arquivo, string $pasta): ?string
{
    if ($arquivo === null || ($arquivo['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    if ($arquivo['error'] !== UPLOAD_ERR_OK) falhar(400, 'Falha no upload da imagem');
    if ($arquivo['size'] > IMAGEM_MAX_BYTES) falhar(400, 'Imagem muito grande (máximo 5 MB)');

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($arquivo['tmp_name']);
    if (!isset(IMAGEM_TIPOS[$mime]) || getimagesize($arquivo['tmp_name']) === false) {
        falhar(400, 'Tipo de imagem não permitido');
    }

    $diretorio = __DIR__ . '/../uploads/' . $pasta;
    if (!is_dir($diretorio) && !mkdir($diretorio, 0755, true) && !is_dir($diretorio)) {
        falhar(500, 'Falha ao preparar o diretório de upload');
    }

    $nome = bin2hex(random_bytes(16)) . '.' . IMAGEM_TIPOS[$mime];
    if (!move_uploaded_file($arquivo['tmp_name'], "$diretorio/$nome")) {
        falhar(500, 'Falha ao salvar a imagem');
    }
    return "$pasta/$nome";
}

function removerImagem(?string $relativo): void
{
    if ($relativo === null || !preg_match('#^[a-z_]+/[a-f0-9]{32}\.(jpg|png|webp)$#', $relativo)) return;
    $caminho = __DIR__ . '/../uploads/' . $relativo;
    if (is_file($caminho)) @unlink($caminho);
}

function notificar(
    mysqli $conn,
    int $destino,
    string $tipo,
    string $titulo,
    string $mensagem,
    ?int $origem = null,
    ?int $idDenuncia = null,
): void {
    executar(
        $conn,
        'INSERT INTO notificacoes
            (id_usuario, id_tipo_notificacao, titulo, mensagem, id_usuario_origem, id_denuncia)
         SELECT ?, t.id_tipo_notificacao, ?, ?, ?, ?
         FROM tipos_notificacao t WHERE t.nome = ?',
        [$destino, $titulo, $mensagem, $origem, $idDenuncia, $tipo]
    );
}

function nivelPorPontos(int $pontos): int
{
    return min(255, intdiv(max(0, $pontos), PONTOS_POR_NIVEL) + 1);
}

function registrarReputacao(
    mysqli $conn,
    int $idUsuario,
    string $tipo,
    ?int $idDenuncia = null,
    ?string $observacao = null,
): bool {
    $t = consulta(
        $conn,
        'SELECT id_tipo_reputacao, pontos, limite_diario FROM tipos_reputacao WHERE nome = ?',
        [$tipo]
    )[0] ?? null;

    if ($t === null) return false;

    if ($t['limite_diario'] !== null) {
        $hoje = (int) consulta(
            $conn,
            'SELECT COUNT(*) AS n FROM reputacao_eventos
             WHERE id_usuario = ? AND id_tipo_reputacao = ? AND created_at >= CURDATE()',
            [$idUsuario, (int) $t['id_tipo_reputacao']]
        )[0]['n'];

        if ($hoje >= (int) $t['limite_diario']) return false;
    }

    $pontos = (int) $t['pontos'];

    executar(
        $conn,
        'INSERT INTO reputacao_eventos (id_usuario, id_tipo_reputacao, pontos, id_denuncia, observacao)
         VALUES (?, ?, ?, ?, ?)',
        [$idUsuario, (int) $t['id_tipo_reputacao'], $pontos, $idDenuncia, $observacao]
    );

    $contadores = match ($tipo) {
        'denuncia_confirmada'                         => ', denuncias_confirmadas = denuncias_confirmadas + 1',
        'denuncia_rejeitada'                          => ', denuncias_rejeitadas = denuncias_rejeitadas + 1',
        'corroboracao_validada', 'atualizacao_validada' => ', contribuicoes_validadas = contribuicoes_validadas + 1',
        default                                       => '',
    };

    executar(
        $conn,
        "INSERT INTO reputacao_usuarios (id_usuario, pontos) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE pontos = pontos + VALUES(pontos) $contadores",
        [$idUsuario, $pontos]
    );

    $atual = (int) consulta($conn, 'SELECT pontos FROM reputacao_usuarios WHERE id_usuario = ?', [$idUsuario])[0]['pontos'];
    executar($conn, 'UPDATE reputacao_usuarios SET nivel = ? WHERE id_usuario = ?', [nivelPorPontos($atual), $idUsuario]);

    return true;
}

function existe(mysqli $conn, string $tabela, string $coluna, int $id): bool
{
    static $permitidos = [
        'denuncias' => 'id_denuncia', 'usuarios' => 'id_usuario', 'regioes' => 'id_regiao',
        'orgaos_publicos' => 'id_orgao', 'corroboracoes' => 'id_corroboracao',
        'denuncia_comentarios' => 'id_comentario', 'alertas_regiao' => 'id_alerta',
    ];
    if (($permitidos[$tabela] ?? null) !== $coluna) {
        throw new LogicException('Tabela/coluna não permitida');
    }
    return (bool) consulta($conn, "SELECT 1 FROM $tabela WHERE $coluna = ? LIMIT 1", [$id]);
}