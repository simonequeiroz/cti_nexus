package br.com.ctinexus.dto;

import java.util.Map;

// Uma linha da planilha dentro do Java: o número da linha no Excel + o texto de cada coluna.
// As chaves do mapa são os nomes da classe Colunas (ex.: "codigo_cliente" -> "CTI001").
// Usada no envio real (POST /api/uploads/validadas), que recusa só a linha com erro e grava as outras.
public record LinhaPlanilha(int numero, Map<String, String> campos) {}
