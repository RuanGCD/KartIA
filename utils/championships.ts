import { ID, Query, Permission, Role } from "appwrite";
import { databases } from "../utils/appwrite";

const DATABASE_ID = "68f65dd60011cc69ba07";
const COLLECTION_ID = "championships";

function generateCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// 🏁 Criar campeonato
export async function createChampionship(nome: string, ownerId: string) {
  try {
    const code = generateCode();
    const newChamp = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        nome,
        ownerId,
        code,
        scores: JSON.stringify({ [ownerId]: 0 }),
        players: [ownerId],
      },
      [
        Permission.read(Role.any()),      // todos podem ler
        Permission.update(Role.any()),    // todos podem atualizar
        Permission.delete(Role.any()),    // todos podem deletar
        Permission.write(Role.any()),     // todos podem escrever
      ]
    );

    return newChamp;
  } catch (err) {
    console.error("Erro ao criar campeonato:", err);
    throw err;
  }
}

// 🧍 Entrar em um campeonato via código
export async function joinChampionship(code: string, userId: string) {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("code", code.trim().toUpperCase()),
    ]);

    console.log("Resultado da busca:", res.documents);

    if (!res.documents || res.total === 0) {
      throw new Error("Campeonato não encontrado.");
    }

    const champ = res.documents[0];

    const scores = champ.scores ? JSON.parse(champ.scores) : {};
    const players = Array.isArray(champ.players) ? champ.players : [];

    if (players.includes(userId)) {
      return champ; // já está participando
    }

    players.push(userId);
    scores[userId] = 0;

    // Atualiza o documento com permissões abertas
    await databases.updateDocument(
  DATABASE_ID,
  COLLECTION_ID,
  champ.$id,
  {
    players,
    scores: JSON.stringify(scores),
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
      Permission.write(Role.any()),
    ],
  }
);


    return champ;
  } catch (err) {
    console.error("Erro ao entrar no campeonato:", err);
    throw err;
  }
}

// 🏆 Buscar campeonatos do usuário
export async function getChampionshipsByUser(userId: string) {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    const docs = res.documents || [];

    const filtered = docs.filter((d: any) => {
      const scores = d.scores ? JSON.parse(d.scores) : {};
      return d.ownerId === userId || Object.prototype.hasOwnProperty.call(scores, userId);
    });

    return filtered;
  } catch (err) {
    console.error("Erro ao buscar campeonatos:", err);
    return [];
  }
}
