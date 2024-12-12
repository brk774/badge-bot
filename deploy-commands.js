const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands'); // Definir foldersPath

// Pegue todas as pastas de comandos do diretório de comandos
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute" requerida.`);
        }
    }
}

// Verifique se o token está presente
if (!token) {
    console.error('Token não encontrado. Verifique o arquivo config.json.');
    process.exit(1);
}

// Construa e prepare uma instância do módulo REST
const rest = new REST().setToken(token);

// implantando os comandos!
(async () => {
    try {
        console.log(`Iniciado o recarregamento de ${commands.length} comandos de aplicação (/) .`);

        // O método put é usado para recarregar totalmente todos os comandos na guilda com o conjunto atual
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Com sucesso, ${data.length} comandos de aplicação (/) foram recarregados.`);
    } catch (error) {
        // E, claro, certifique-se de capturar e registrar quaisquer erros!
        console.error('Erro ao fazer o deploy dos comandos:', error);
    }
})();
