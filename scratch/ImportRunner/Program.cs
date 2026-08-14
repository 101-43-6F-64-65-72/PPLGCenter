using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Microsoft.AspNetCore.Identity;
using StudentCenter.Domain.Entities;

namespace GenerateSql;

class Program
{
    static void Main()
    {
        var passwordHasher = new PasswordHasher<User>();
        var dummyUser = new User();

        var csvPath = @"d:\.SCHOOL\StudentCenter\scratch\teachers_import.csv";
        var rawCsvData = File.ReadAllText(csvPath);

        var lines = rawCsvData.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        var header = ParseCsvLine(lines[0]);
        var colMap = header.Select((h, i) => new { Name = h.Trim().ToLower(), Index = i })
                           .ToDictionary(x => x.Name, x => x.Index);

        var sb = new StringBuilder();
        sb.AppendLine("-- AUTOMATICALLY GENERATED TEACHER IMPORT SQL --");

        for (int i = 1; i < lines.Length; i++)
        {
            var row = ParseCsvLine(lines[i]);
            if (row.All(string.IsNullOrWhiteSpace)) continue;

            string GetVal(string colName) => colMap.TryGetValue(colName, out var idx) && idx < row.Count ? row[idx].Trim() : string.Empty;

            var fullName = GetVal("nama");
            var nipRaw = GetVal("nip");
            var email = GetVal("email");
            var phone = GetVal("hp");
            var address = GetVal("alamat");
            var gender = GetVal("gender");
            var birthStr = GetVal("tanggal lahir");
            var position = GetVal("position");
            var password = GetVal("password");

            var id = Guid.NewGuid().ToString();
            string? nipSql = (string.IsNullOrWhiteSpace(nipRaw) || nipRaw == "-") ? "NULL" : $"'{EscapeSql(nipRaw)}'";
            string emailSql = $"'{EscapeSql(email.ToLower())}'";
            string nameSql = $"'{EscapeSql(fullName)}'";
            string phoneSql = string.IsNullOrWhiteSpace(phone) ? "NULL" : $"'{EscapeSql(phone)}'";
            string addressSql = string.IsNullOrWhiteSpace(address) ? "NULL" : $"'{EscapeSql(address)}'";
            string genderSql = string.IsNullOrWhiteSpace(gender) ? "NULL" : $"'{EscapeSql(gender)}'";
            string positionSql = string.IsNullOrWhiteSpace(position) ? "'Guru'" : $"'{EscapeSql(position)}'";
            
            string birthSql = "NULL";
            if (DateTime.TryParse(birthStr, out var parsedBirth))
            {
                birthSql = $"'{parsedBirth:yyyy-MM-dd HH:mm:ss}+00'";
            }

            var hash = passwordHasher.HashPassword(dummyUser, string.IsNullOrWhiteSpace(password) ? "Guru123!" : password);
            string hashSql = $"'{EscapeSql(hash)}'";

            sb.AppendLine($"INSERT INTO \"Users\" (\"Id\", \"FullName\", \"Email\", \"NIP\", \"PhoneNumber\", \"Address\", \"Gender\", \"BirthDate\", \"Position\", \"PasswordHash\", \"Role\", \"IsActive\", \"CreatedAt\", \"UpdatedAt\") VALUES ('{id}', {nameSql}, {emailSql}, {nipSql}, {phoneSql}, {addressSql}, {genderSql}, {birthSql}, {positionSql}, {hashSql}, 1, true, NOW(), NOW());");
        }

        File.WriteAllText(@"d:\.SCHOOL\StudentCenter\scratch\insert_teachers.sql", sb.ToString());
        Console.WriteLine("SQL Statements generated successfully!");
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(sb.ToString().Trim());
                sb.Clear();
            }
            else
            {
                sb.Append(c);
            }
        }
        result.Add(sb.ToString().Trim());
        return result;
    }

    private static string EscapeSql(string str)
    {
        return str.Replace("'", "''");
    }
}
