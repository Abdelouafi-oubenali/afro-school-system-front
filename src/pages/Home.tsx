import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenue sur Afro School System
          </h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-lg">
            <span className="font-semibold">Connecté en tant que :</span> {user?.name}
          </p>
          <p className="text-gray-600">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Étudiants</h3>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm opacity-90">Total des étudiants</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Cours</h3>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm opacity-90">Cours disponibles</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Enseignants</h3>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm opacity-90">Personnel enseignant</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Tableau de bord</h2>
          <p className="text-gray-600">
            Système de gestion scolaire - Votre espace d'administration
          </p>
        </div>
      </div>
    </div>
  );
}
