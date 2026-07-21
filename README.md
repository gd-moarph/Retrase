<p align="center">
  <a href="https://retrase.ro">
    <img src="public/retrase-icon.svg" alt="Simbol Retrase.ro" width="72">
  </a>
</p>

<h1 align="center">Retrase.ro</h1>

<p align="center">
  Platformă publică pentru consultarea medicamentelor și produselor retrase din România.
</p>

<p align="center">
  <a href="https://retrase.ro"><img alt="Site Retrase.ro" src="https://img.shields.io/badge/Site-Retrase.ro-1d4ed8?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="LICENSE"><img alt="Licență AGPL-3.0" src="https://img.shields.io/badge/Licență-AGPL--3.0-2563eb?style=for-the-badge&logo=gnu&logoColor=white"></a>
  <img alt="Acces gratuit" src="https://img.shields.io/badge/Acces-Gratuit-16a34a?style=for-the-badge&logo=opensourceinitiative&logoColor=white">
  <img alt="Fără cont" src="https://img.shields.io/badge/Cont-Nu%20este%20necesar-0f766e?style=for-the-badge&logo=checkmarx&logoColor=white">
</p>

<p align="center">
  <a href="https://www.anm.ro"><img alt="ANMDMR — Medicamente" src="https://img.shields.io/badge/ANMDMR-Medicamente-2563eb?style=for-the-badge"></a>
  <a href="https://www.ansvsa.ro"><img alt="ANSVSA — Produse retrase" src="https://img.shields.io/badge/ANSVSA-Produse%20retrase-f97316?style=for-the-badge"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-111827?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Date-4169e1?style=for-the-badge&logo=postgresql&logoColor=white">
</p>

## Despre proiect

Retrase.ro centralizează și structurează informații publicate de instituțiile competente despre:

- notificările de discontinuitate pentru medicamente;
- nomenclatorul medicamentelor autorizate în România;
- retragerile și rechemările de produse generale.

Platforma este gratuită, nu necesită înregistrare și nu include abonamente, plăți, profiluri sau notificări comerciale. Căutarea și exporturile XLSX sunt disponibile public, cu limite tehnice anonime pentru protejarea serviciului.

## Funcționalități

- căutare și filtrare în notificările de discontinuitate ANMDMR;
- căutare în nomenclatorul medicamentelor autorizate;
- consultarea produselor retrase sau rechemate de ANSVSA;
- export XLSX pentru seturile publice de date;
- pagină publică pentru starea surselor și a importurilor;
- importuri automate, tranzacționale și protejate împotriva execuțiilor simultane;
- păstrarea versiunilor distincte ale documentelor oficiale în stocare S3 privată.

## Surse oficiale

| Set de date | Instituție | Sursă |
| --- | --- | --- |
| Discontinuități medicamente | ANMDMR | [Notificări de discontinuitate](https://www.anm.ro/medicamente-de-uz-uman/autorizare-medicamente/notificari-discontinuitate-medicamente/) |
| Nomenclator medicamente | ANMDMR | [Nomenclatorul medicamentelor](https://nomenclator.anm.ro/) |
| Produse retrase și rechemate | ANSVSA | [Portalul ANSVSA](https://www.ansvsa.ro/) |

Retrase.ro nu este afiliat și nu reprezintă oficial ANMDMR sau ANSVSA. Pentru decizii medicale ori comerciale trebuie consultate documentele oficiale și profesioniștii autorizați.

## Arhitectură

- **Next.js 16 și React 19** pentru interfața publică și rutele API;
- **TypeScript** pentru aplicație, importatoare și comenzi operaționale;
- **PostgreSQL și Prisma** pentru date normalizate, starea importurilor și metadate;
- **stocare compatibilă S3** pentru fișierele PDF și XLSX originale;
- **Railway Cron** pentru actualizarea periodică a surselor;
- **Vitest** pentru testele unitare și de regresie.

Fișierele oficiale sunt identificate prin SHA-256. O versiune neschimbată nu este procesată din nou, iar publicarea datelor are loc numai după validarea completă a documentului.

## Rulare locală

### Cerințe

- Node.js 22;
- npm;
- PostgreSQL;
- un bucket privat compatibil S3.

### Instalare

```bash
git clone https://github.com/gd-moarph/Retrase.git
cd Retrase
npm ci
npx prisma generate
npm run db:migrate
npm run dev
```

Aplicația va fi disponibilă implicit la `http://localhost:3000`.

### Configurare

Variabilele de mai jos trebuie definite în mediul local sau în platforma de găzduire. Valorile de producție și datele sensibile nu trebuie adăugate în Git.

| Variabilă | Rol |
| --- | --- |
| `DATABASE_URL` | Conexiunea PostgreSQL |
| `AWS_ENDPOINT_URL` | Endpoint-ul serviciului S3 |
| `AWS_ACCESS_KEY_ID` | Identificatorul de acces S3 |
| `AWS_SECRET_ACCESS_KEY` | Cheia secretă S3 |
| `AWS_S3_BUCKET_NAME` | Numele bucketului privat |
| `AWS_DEFAULT_REGION` | Regiunea bucketului |
| `AWS_S3_URL_STYLE` | Stilul adreselor S3, de regulă `virtual` |
| `RATE_LIMIT_SALT` | Salt secret pentru anonimizarea identificatorilor de limitare |

## Importuri

```bash
npm run import:anm-nomenclature -- --dry-run
npm run import:anm-discontinuities -- --dry-run
npm run import:ansvsa -- --dry-run
npm run import:all -- --dry-run
```

Opțiunea `--dry-run` descarcă și validează sursa fără a publica modificări. Opțiunea `--force` trebuie folosită numai după verificarea manuală a documentului oficial.

## Verificări locale

```bash
npm test
npm run lint
npm run build
```

## API public

- `GET /api/cautare/medicamente`
- `GET /api/cautare/produse-generale`
- `GET /api/export/farmaceutice`
- `GET /api/export/produse-generale`
- `GET /api/surse-date/stare`
- `GET /api/sanatate`

Exporturile sunt limitate la 10.000 de înregistrări per cerere. Cererile excesive primesc răspunsul `429` și antetul `Retry-After`.

## Contribuții

Contribuțiile sunt binevenite prin pull request. Înainte de trimitere:

1. creează o ramură separată;
2. păstrează modificările concentrate pe o singură problemă;
3. adaugă sau actualizează testele relevante;
4. rulează testele, lint-ul și build-ul de producție;
5. descrie clar comportamentul modificat și modul de verificare.

Problemele de securitate trebuie raportate în mod privat la [dumitruninelgabriel@gmail.com](mailto:dumitruninelgabriel@gmail.com), nu într-un issue public.

## Licență

Codul este distribuit sub [GNU Affero General Public License v3.0](LICENSE). Orice versiune modificată oferită utilizatorilor printr-o rețea trebuie să pună la dispoziție codul sursă corespunzător, conform condițiilor licenței.

## Autor

Proiect construit și întreținut de **Gabriel Dumitru**.

- Website: [Retrase.ro](https://retrase.ro)
- Contact: [dumitruninelgabriel@gmail.com](mailto:dumitruninelgabriel@gmail.com)
