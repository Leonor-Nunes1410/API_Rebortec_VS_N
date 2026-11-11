using System.ComponentModel;
using System.Data.SqlTypes;
using MySqlConnector;

public partial class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Configuração de CORS para permitir pedidos do frontend
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("PermitirTudo", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        app.UseSwagger();
        app.UseSwaggerUI();
        app.UseCors("PermitirTudo");

        string dadosConexao = "Server=localhost; Database=rebortec_db;UID=root;Pwd=980114;";

        // ENDPOINTS DE AUTENTICAÇÃO
        app.MapPost("/api/registo", async (RegistoDTO dados) =>
        {
            if (string.IsNullOrWhiteSpace(dados.Username) || string.IsNullOrWhiteSpace(dados.Password))
            {
                return Results.BadRequest("Preencha todos os campos.");
            }

            using var ligacao = new MySqlConnection(dadosConexao);
            await ligacao.OpenAsync();

            string sql = "INSERT INTO utilizadores (username, password) VALUES (@user, @pass)";
            using var comando = new MySqlCommand(sql, ligacao);
            comando.Parameters.AddWithValue("@user", dados.Username);
            comando.Parameters.AddWithValue("@pass", dados.Password);

            try
            {
                await comando.ExecuteNonQueryAsync();
                return Results.Ok("Utilizador registado com sucesso!");
            }
            catch (MySqlException)
            {
                return Results.BadRequest("Erro ao criar utilizador ou nome já existente.");
            }
        });

        app.MapPost("/api/login", async (LoginDTO dados) =>
        {
            using var ligacao = new MySqlConnection(dadosConexao);
            await ligacao.OpenAsync();

            string sql = "SELECT username FROM utilizadores WHERE username = @user AND password = @pass";
            using var comando = new MySqlCommand(sql, ligacao);
            comando.Parameters.AddWithValue("@user", dados.Username);
            comando.Parameters.AddWithValue("@pass", dados.Password);

            using var leitor = await comando.ExecuteReaderAsync();
            if (await leitor.ReadAsync())
            {
                string user = leitor.GetString("username");
                return Results.Ok(new { username = user });
            }

            return Results.BadRequest("Utilizador ou palavra-passe incorretos.");
        });

        // CÁLCULO DE IVA
        app.MapGet("/api/calculo-iva", (double valorBase) =>
        {
            double valorIVA = valorBase * 0.23;
            double total = valorBase + valorIVA;

            return Results.Ok(new
            {
                Mensagem = "Cálculo efetuado com sucesso!",
                Base = valorBase,
                IVA = valorIVA,
                Total = total
            });
        });

        // GESTÃO DE CLIENTES
        app.MapGet("/api/clientes", async () =>
        {
            var lista = new List<object>();

            using var ligacao = new MySqlConnection(dadosConexao);
            await ligacao.OpenAsync();

            using var comando = new MySqlCommand("SELECT id, nome, nif FROM clientes", ligacao);
            using var leitor = await comando.ExecuteReaderAsync();

            while (await leitor.ReadAsync())
            {
                lista.Add(new
                {
                    id = leitor.GetInt32("id"),
                    nome = leitor.GetString("nome"),
                    nif = leitor.GetString("nif")
                });
            }
            return Results.Ok(lista);
        });

        app.MapPost("/api/clientes", async (NovoCliente dados) =>
        {
            if (string.IsNullOrWhiteSpace(dados.Nif) || dados.Nif.Length != 9)
            {
                return Results.BadRequest("Erro: O NIF tem de ter exatamente 9 dígitos.");
            }

            using var ligacao = new MySqlConnection(dadosConexao);
            await ligacao.OpenAsync();

            string sql = "INSERT INTO clientes (nome, nif) VALUES (@nome, @nif)";
            using var comando = new MySqlCommand(sql, ligacao);
            comando.Parameters.AddWithValue("@nome", dados.Nome);
            comando.Parameters.AddWithValue("@nif", dados.Nif);
            await comando.ExecuteNonQueryAsync();

            return Results.Ok("Cliente guardado no MySQL com sucesso!");
        });

        app.Run();
    }

    public record RegistoDTO(string Username, string Password);
    public record LoginDTO(string Username, string Password);
    public record NovoCliente(string Nome, string Nif);
}