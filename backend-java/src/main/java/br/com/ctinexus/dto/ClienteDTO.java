package br.com.ctinexus.dto;

import jakarta.validation.constraints.NotBlank; // Texto obrigatório: recusa null, vazio e só espaços.
import jakarta.validation.constraints.NotNull;  // Valor obrigatório: recusa null (para quem não é texto).
import jakarta.validation.constraints.Pattern;  // Compara o texto com uma regra de formato (regex).
import jakarta.validation.constraints.Positive; // Número maior que zero: recusa zero e negativo.
import jakarta.validation.constraints.Size;     // Limita o tamanho do texto (guia técnico do DTO).

import java.math.BigDecimal; // Número exato: dinheiro não pode perder centavos.
import java.time.LocalDate;  // Data sem hora. O Java só aceita data que existe (31/02 dá erro).

// DTO = Data Transfer Object: o formato dos dados que chegam do front-end. Não grava no banco.
// Aula "Validação de dados no Backend": cada anotação é uma regra SIMPLES de UMA linha.
// As anotações ficam aqui; quem manda executá-las é o @Valid, lá no Controller.
// O que precisa comparar linhas ou alterar o conteúdo fica no Service (ClienteValidacaoService).
//
// record = classe curta só para transportar dados (o Java cria construtor e os métodos de leitura).
public record ClienteDTO(

        @NotBlank(message = "O código do cliente é obrigatório")
        @Size(max = 30, message = "O código do cliente deve ter no máximo 30 caracteres")
        String codigoCliente, // Coluna codigo_cliente da planilha.

        @NotBlank(message = "O nome do cliente é obrigatório")
        @Size(max = 150, message = "O nome do cliente deve ter no máximo 150 caracteres")
        String nomeCliente, // Coluna nome_cliente.

        @NotBlank(message = "O consultor é obrigatório")
        @Size(max = 120, message = "O consultor deve ter no máximo 120 caracteres")
        String consultor, // Coluna consultor.

        @NotBlank(message = "O segmento é obrigatório") // Aqui só confere se veio; "IND." vira "Indústria" no Service.
        @Size(max = 100, message = "O segmento deve ter no máximo 100 caracteres")
        String segmento,

        @NotBlank(message = "O nível do cliente é obrigatório")
        @Pattern(regexp = "^[ABCabc]$", message = "O nível deve ser A, B ou C") // Só essas três letras; o Service passa "b" para "B".
        String nivelCliente,

        @NotNull(message = "O faturamento anual é obrigatório")
        @Positive(message = "O faturamento anual deve ser maior que zero") // Bloqueia zero e negativo.
        BigDecimal faturamentoAnual, // No slide é Double; BigDecimal é igual ao banco, NUMERIC(15,2), e não arredonda centavos.

        @NotBlank(message = "Os serviços contratados são obrigatórios")
        String servicosContratados, // Lista em texto: "Internet Dedicada;Firewall".

        @NotNull(message = "A data de contratação é obrigatória")
        LocalDate dataContratacao, // No JSON, no formato aaaa-mm-dd (ex.: "2025-01-15").

        @Size(max = 100, message = "A cidade deve ter no máximo 100 caracteres") // Só limita o tamanho: sem @NotBlank, pode vir vazia.
        String cidade, // Opcional.

        @Pattern(regexp = "^$|^[A-Za-z]{2}$", message = "A UF deve possuir duas letras") // Vazia OU 2 letras: aceita SP; recusa S e SPP.
        String uf, // Opcional, mas se vier preenchida tem que estar certa.

        // Não está no slide: coluna a mais do nosso projeto (atividade "Pinia - Validação de Planilha").
        // (?!.*\.\.) recusa dois pontos seguidos, como "ana..souza@empresa.com".
        @Pattern(regexp = "^$|^(?!.*\\.\\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$",
                message = "O e-mail não tem formato válido (ex.: contato@empresa.com.br)")
        String email
) {}
