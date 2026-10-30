package br.com.ctinexus.dto;

import java.util.Map;

// Uma linha da planilha dentro do Java: o número da linha no Excel + o texto de cada coluna.
// As chaves do mapa são os nomes da classe Colunas (ex.: "codigo_cliente" -> "CTI001").
public record ClienteDTO(int numero, Map<String, String> campos) {}
