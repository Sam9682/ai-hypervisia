import { useState, useEffect } from 'react';
import { adminService, type User } from '../services/adminService';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'member',
    password: '',
    membership_expires_at: '',
    membership_status: '',
    is_email_verified: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.listUsers();
      setUsers(response.members);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    const expiresAt = user.membership_expires_at 
      ? new Date(user.membership_expires_at).toISOString().slice(0, 16)
      : '';
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: '',
      membership_expires_at: expiresAt,
      membership_status: user.membership_status,
      is_email_verified: user.is_email_verified,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      // Update role
      await adminService.updateUserRole(editingUser.id, formData.role);
      
      // Update email verification status
      await adminService.updateEmailVerification(editingUser.id, formData.is_email_verified);
      
      // Update membership status
      const membershipExpiresAt = formData.membership_expires_at 
        ? new Date(formData.membership_expires_at).toISOString()
        : null;
      await adminService.updateMembershipStatus(editingUser.id, membershipExpiresAt);
      
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) return;
    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await adminService.createUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      });
      setShowCreateModal(false);
      setFormData({ 
        email: '', 
        first_name: '', 
        last_name: '', 
        role: 'member', 
        password: '',
        membership_expires_at: '',
        membership_status: '',
        is_email_verified: true,
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          ➕ Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.last_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.first_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded ${
                    user.role === 'administrator' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'member' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded ${
                    user.membership_status === 'active' ? 'bg-green-100 text-green-800' :
                    user.membership_status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.membership_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️ Désactiver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier l'utilisateur</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="visitor">Visiteur</option>
                  <option value="member">Membre</option>
                  <option value="administrator">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Statut actuel
                </label>
                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50">
                  <span className={`px-2 py-1 rounded text-sm ${
                    formData.membership_status === 'active' ? 'bg-green-100 text-green-800' :
                    formData.membership_status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {formData.membership_status === 'active' ? 'Actif' :
                     formData.membership_status === 'expired' ? 'Expiré' :
                     'Suspendu'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le statut est calculé automatiquement selon la vérification email et la date d'expiration
                </p>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_email_verified}
                    onChange={(e) => setFormData({ ...formData, is_email_verified: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Email vérifié</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Si décoché, le statut sera "Suspendu"
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date d'expiration de l'adhésion
                </label>
                <input
                  type="datetime-local"
                  value={formData.membership_expires_at}
                  onChange={(e) => setFormData({ ...formData, membership_expires_at: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour une adhésion à vie (statut "Actif")
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouvel utilisateur</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prénom</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="visitor">Visiteur</option>
                  <option value="member">Membre</option>
                  <option value="administrator">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
