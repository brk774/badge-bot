const express = require('express');
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const app = express();
const port = 3000;

// Pasta onde os comandos estão localizados
const commandsPath = path.join(__dirname, 'commands/utility');

// Configuração do servidor Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota para listar comandos
app.get('/commands', (req, res) => {
    fs.readdir(commandsPath, (err, files) => {
        if (err) return res.status(500).send('Erro ao ler comandos.');

        const commandFiles = files.filter(file => file.endsWith('.js')).map(file => file.replace('.js', ''));
        res.json(commandFiles);
    });
});

// Rota para enviar comandos para deploy
app.post('/deploy-commands', async (req, res) => {
    const { commands } = req.body;
    const commandsData = [];

    // Verificar se os comandos existem e criar dados para eles
    for (const commandName of commands) {
        const commandFilePath = path.join(__dirname, 'commands/utility', `${commandName}.js`);
        if (fs.existsSync(commandFilePath)) {
            const command = require(commandFilePath);
            if ('data' in command) {
                commandsData.push(command.data.toJSON());
            } else {
                console.log(`[AVISO] O comando em ${commandFilePath} está faltando a propriedade "data".`);
            }
        } else {
            console.log(`[AVISO] O comando ${commandName} não foi encontrado.`);
        }
    }

    // Construa e prepare uma instância do módulo REST
    const rest = new REST().setToken(token);

    try {
        console.log(`Iniciado o recarregamento de ${commandsData.length} comandos de aplicação (/) .`);

        // O método put é usado para recarregar totalmente todos os comandos na guilda com o conjunto atual
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commandsData },
        );

        console.log(`Com sucesso, ${data.length} comandos de aplicação (/) foram recarregados.`);
        res.send('Comandos enviados para deploy.');
    } catch (error) {
        console.error('Erro ao fazer o deploy dos comandos:', error);
        res.status(500).send('Erro ao fazer o deploy dos comandos.');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Inicializa o bot
require('./index.js'); // Importa e executa o código do bot
