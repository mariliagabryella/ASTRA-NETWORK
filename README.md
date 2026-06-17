<p align="center">
  <img src="astra-frontend/src/assets/logo_purple-removebg-preview.png" alt="Astra Network" width="220">
</p>

<h1 align="center">Astra Network</h1>

<p align="center">
  Plataforma self-hosted de gestão de redes overlay <a href="https://github.com/slackhq/nebula">Nebula</a>, com geração e assinatura automática de certificados, gestão de hosts e exportação da configuração final em YAML.
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

---

## 📖 Sobre o projeto

O **Astra Network** é uma aplicação full-stack (Node.js/Express + React/Vite) que funciona como um painel de controlo para redes [Nebula](https://github.com/slackhq/nebula), a VPN mesh overlay de código aberto criada pela Slack.

A gestão manual de uma rede Nebula passa por gerar à mão a autoridade certificadora (CA), gerar e assinar certificados para cada host, e escrever o ficheiro `config.yml` de cada máquina. O Astra Network automatiza todo esse fluxo através de uma interface web: inicializa a CA, assina certificados, atribui IPs automaticamente, identifica lighthouses e gera o ficheiro de configuração final pronto a usar em cada host.

Este projeto foi inspirado pelo [Gestor_nebulaVpn](https://github.com/GuilhermeGarcia-pascoa/Gestor_nebulaVpn) de GuilhermeGarcia-pascoa, construído diretamente sobre o [Nebula](https://github.com/slackhq/nebula) da Slack, e segue a filosofia de gestão centralizada de redes overlay popularizada pela [Defined Networking](https://www.defined.net/) (a empresa fundada pelos criadores do Nebula).

## ✨ Funcionalidades

- **Assistente de configuração inicial** — define o IP base e a máscara da rede no primeiro arranque.
- **Gestão da Autoridade Certificadora (CA)** — inicializa a CA Nebula diretamente a partir da interface, com duração configurável.
- **CRUD de hosts** — cria, edita, consulta e remove hosts da rede.
- **Geração e assinatura automática de certificados** — cada host criado/editado é automaticamente assinado pela CA usando o binário `nebula-cert`.
- **Atribuição automática de IP** — sugere o próximo IP livre dentro da rede configurada.
- **Suporte a lighthouses** — marca qualquer host como lighthouse e a app atualiza o `static_host_map` e a lista de lighthouses de todos os ficheiros gerados.
- **Exportação de `config.yaml`** — gera e permite descarregar a configuração Nebula completa e pronta a usar para cada host (certificados embebidos, mapa de hosts estáticos, lighthouses, firewall, etc.).
- **Configurações persistentes** — caminhos do binário `nebula-cert` e da CA configuráveis e guardados em disco.

## 🏗️ Arquitetura / Stack tecnológica

| Camada     | Tecnologias |
|------------|-------------|
| Backend    | Node.js, Express 5, Mongoose (MongoDB), `nebula-cert` (via `child_process`), Archiver, dotenv |
| Frontend   | React 19, Vite, React Router 7, lucide-react |
| Base de dados | MongoDB |
| Overlay VPN | [Nebula](https://github.com/slackhq/nebula) (slackhq) |

O backend nunca implementa criptografia própria: invoca o binário oficial `nebula-cert` para gerar a CA e assinar certificados, e guarda apenas o resultado (chaves e certificados) na base de dados.

## 📸 Capturas de ecrã

<p align="center">
  <img src="fotos/Screenshot from 2026-04-28 17-41-19.png" alt="Configuração YAML gerada" width="500"><br>
  <em>Configuração Nebula gerada automaticamente para um host</em>
</p>

<p align="center">
  <img src="fotos/Screenshot from 2026-04-29 12-41-19.png" alt="Documento de host na base de dados" width="600"><br>
  <em>Documento de um host guardado no MongoDB</em>
</p>

## 🧰 Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [MongoDB](https://www.mongodb.com/) em execução (local ou remoto)
- Binários oficiais [`nebula`](https://github.com/slackhq/nebula/releases) e `nebula-cert` (necessários apenas no backend, para gerar a CA e assinar certificados)

## ⚙️ Instalação

```bash
git clone https://github.com/<o-teu-user>/astra-network.git
cd astra-network
```

### Backend

```bash
cd astra-backend
npm install
cp .env.example .env   # edita PORT e MONGODB_URI
```

Coloca os binários `nebula` e `nebula-cert` (descarregados das [releases oficiais](https://github.com/slackhq/nebula/releases)) dentro de `astra-backend/bin/` e garante permissões de execução:

```bash
chmod +x bin/nebula bin/nebula-cert
```

```bash
npm run dev   # ou: npm start
```

### Frontend

```bash
cd astra-frontend
npm install
cp .env.example .env   # confirma VITE_API_URL (ex: http://localhost:5000/api/hosts)
npm run dev
```

A aplicação fica disponível em `http://localhost:5173` (frontend) e a API em `http://localhost:5000` (backend).

## ▶️ Como usar

1. No primeiro acesso, define o **IP base** (ex: `10.0.0`) e a **máscara** (ex: `24`) da rede.
2. Em **Configurações**, inicializa a **CA** da rede (nome e duração do certificado raiz).
3. Cria um novo **host**: nome, grupos, se é lighthouse, IP público/domínio e porta. O Astra atribui automaticamente o próximo IP interno livre e gera o certificado assinado pela CA.
4. Na página de detalhes do host, descarrega o `config.yaml` final — já com a chave privada, o certificado e o mapa de hosts/lighthouses preenchidos.
5. Copia esse ficheiro para `/etc/nebula/config.yml` em cada máquina e arranca o serviço `nebula -config /etc/nebula/config.yml`.

## 🗂️ Estrutura do projeto

```
astra-network/
├── astra-backend/
│   ├── bin/                # binários nebula / nebula-cert (não versionados)
│   ├── ca/                 # CA gerada (ca.crt / ca.key — ignorado no git)
│   ├── src/
│   │   ├── config/         # ligação à BD + template YAML
│   │   ├── controllers/    # lógica das rotas (hosts, CA, rede)
│   │   ├── models/         # esquemas Mongoose (Host, NetworkConfig)
│   │   ├── services/       # cryptoService (nebula-cert) e configService (YAML)
│   │   └── server.js
│   └── package.json
├── astra-frontend/
│   ├── src/
│   │   ├── components/     # CreateHost, NetworkSetupModal
│   │   ├── pages/           # ManageHosts, HostDetails, Settings
│   │   └── App.jsx
│   └── package.json
└── fotos/                  # capturas de ecrã
```

## 🔌 Endpoints da API

| Método | Endpoint                         | Descrição |
|--------|-----------------------------------|-----------|
| GET    | `/api/hosts`                      | Lista todos os hosts |
| POST   | `/api/hosts`                      | Cria um host (gera e assina certificado) |
| GET    | `/api/hosts/:id`                  | Detalhe de um host |
| PUT    | `/api/hosts/:id`                  | Atualiza um host |
| DELETE | `/api/hosts/:id`                  | Remove um host |
| GET    | `/api/hosts/download/:id`         | Descarrega o `config.yaml` final do host |
| GET    | `/api/hosts/next-ip`              | Sugere o próximo IP livre |
| GET    | `/api/hosts/network-config`       | Obtém a configuração base da rede |
| POST   | `/api/hosts/network-config`       | Guarda a configuração base da rede |
| GET    | `/api/ca/status`                  | Estado da CA |
| POST   | `/api/hosts/settings/generate-ca` | Inicializa a CA |
| GET/POST | `/api/hosts/settings/paths`     | Lê/define caminhos do binário e da CA |

## 🔒 Notas de segurança

- `ca.key` e ficheiros `.env` já estão excluídos via `.gitignore` — nunca os comites.
- As chaves privadas dos hosts ficam guardadas na base de dados; protege o acesso ao MongoDB em produção.
- Esta ferramenta foi pensada para uso em rede local/confiável (homelab); para produção, considera adicionar autenticação à API.

## 🗺️ Roadmap

- [ ] Autenticação na API (já existem dependências `jsonwebtoken`/`bcryptjs` previstas para isso)
- [ ] Containerização com Docker Compose (backend + frontend + MongoDB)
- [ ] Revogação de certificados

## 🙏 Inspiração e créditos

- [Nebula](https://github.com/slackhq/nebula) — a VPN overlay mesh da Slack sobre a qual este projeto é construído.
- [Gestor_nebulaVpn](https://github.com/GuilhermeGarcia-pascoa/Gestor_nebulaVpn) de **GuilhermeGarcia-pascoa** — projeto que serviu de inspiração inicial.
- [Defined Networking](https://www.defined.net/) — plataforma comercial dos criadores do Nebula, cuja filosofia de gestão centralizada inspirou o conceito deste painel.

## 📄 Licença

Distribuído sob a licença MIT. Consulta o ficheiro `LICENSE` para mais detalhes.

## ✍️ Autor

Desenvolvido por **Marília**.
