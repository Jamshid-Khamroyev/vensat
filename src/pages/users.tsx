import { useEffect, useState } from 'react';
import {
  Users as UsersIcon,
  Shield,
  User,
  Mail,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Award,
  Search,
  Filter,
  MoreVertical,
  X
} from 'lucide-react';
import { AppUser } from '../types/index';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/users');
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Foydalanuvchilarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        user =>
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-700';
      case 'owner':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'owner':
        return <Award className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <UsersIcon className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Yuklanyapti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-rose-600 font-bold mt-1">!</div>
            <div>
              <h3 className="font-medium text-rose-900 mb-1">Xatolik</h3>
              <p className="text-rose-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Foydalanuvchilar</h1>
                <p className="text-sm text-gray-500">
                  Jami: <span className="font-medium text-gray-700">{filteredUsers.length}</span> / {users.length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ism yoki email bo'yicha izlash..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all"
              >
                <option value="all">Barcha rollar</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="user">Foydalanuvchi</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                  <path d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  <path fillRule="evenodd" d="M3 9a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  <path fillRule="evenodd" d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <UsersIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">Foydalanuvchi topilmadi</p>
            <p className="text-gray-500 text-sm mt-2">Filter shartlarini o'zgartirib ko'rib chiqing</p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-gray-300"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {user.displayName || 'Nomalum foydalanuvchi'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role badge */}
                  {user.role && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${getRoleBadgeStyle(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  )}

                  {/* Skills Section */}
                  <div className="space-y-3">
                    {/* EOI Skill */}
                    {user.eoi_skill && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">EOI Skill</span>
                          <span className={`text-xs font-semibold ${getScoreColor(user.eoi_skill.score)}`}>
                            {user.eoi_skill.score}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(user.eoi_skill.score)}`}
                            style={{ width: `${user.eoi_skill.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* SEC Skill */}
                    {user.sec_skill && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">SEC Skill</span>
                          <span className={`text-xs font-semibold ${getScoreColor(user.sec_skill.score)}`}>
                            {user.sec_skill.score}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(user.sec_skill.score)}`}
                            style={{ width: `${user.sec_skill.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* IAI Skill */}
                    {user.iai_skill && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">IAI Skill</span>
                          <span className={`text-xs font-semibold ${getScoreColor(user.iai_skill.score)}`}>
                            {user.iai_skill.score}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(user.iai_skill.score)}`}
                            style={{ width: `${user.iai_skill.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* CAS Skill */}
                    {user.cas_skill && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">CAS Skill</span>
                          <span className={`text-xs font-semibold ${getScoreColor(user.cas_skill.score)}`}>
                            {user.cas_skill.score}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(user.cas_skill.score)}`}
                            style={{ width: `${user.cas_skill.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Accuracy */}
                    {user.accuracy && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-700">Aniqlik</span>
                          <span className={`text-xs font-semibold ${getScoreColor(user.accuracy.score)}`}>
                            {user.accuracy.score}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(user.accuracy.score)}`}
                            style={{ width: `${user.accuracy.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                    </div>
                    <button className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors">
                      Ko'rish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Foydalanuvchi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">EOI</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">SEC</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">IAI</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">CAS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Aniqlik</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Qo'shilgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                              {user.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {user.displayName || 'Nomalum'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        {user.role && (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${getRoleBadgeStyle(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="capitalize">{user.role}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.eoi_skill ? (
                          <span className={`text-sm font-semibold ${getScoreColor(user.eoi_skill.score)}`}>
                            {user.eoi_skill.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.sec_skill ? (
                          <span className={`text-sm font-semibold ${getScoreColor(user.sec_skill.score)}`}>
                            {user.sec_skill.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.iai_skill ? (
                          <span className={`text-sm font-semibold ${getScoreColor(user.iai_skill.score)}`}>
                            {user.iai_skill.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.cas_skill ? (
                          <span className={`text-sm font-semibold ${getScoreColor(user.cas_skill.score)}`}>
                            {user.cas_skill.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.accuracy ? (
                          <span className={`text-sm font-semibold ${getScoreColor(user.accuracy.score)}`}>
                            {user.accuracy.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg w-full max-w-sm max-h-96 overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Tafsilotlar</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                    {selectedUser.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                    {selectedUser.displayName || 'Nomalum foydalanuvchi'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedUser.email}</p>
                  {selectedUser.role && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(selectedUser.role)}`}>
                      {getRoleIcon(selectedUser.role)}
                      <span className="capitalize">{selectedUser.role}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                {selectedUser.eoi_skill && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700">EOI Skill</span>
                      <span className={`text-sm font-semibold ${getScoreColor(selectedUser.eoi_skill.score)}`}>
                        {selectedUser.eoi_skill.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(selectedUser.eoi_skill.score)}`}
                        style={{ width: `${selectedUser.eoi_skill.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedUser.eoi_skill.questionTaken} savol</p>
                  </div>
                )}

                {selectedUser.sec_skill && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700">SEC Skill</span>
                      <span className={`text-sm font-semibold ${getScoreColor(selectedUser.sec_skill.score)}`}>
                        {selectedUser.sec_skill.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(selectedUser.sec_skill.score)}`}
                        style={{ width: `${selectedUser.sec_skill.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedUser.sec_skill.questionTaken} savol</p>
                  </div>
                )}

                {selectedUser.iai_skill && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700">IAI Skill</span>
                      <span className={`text-sm font-semibold ${getScoreColor(selectedUser.iai_skill.score)}`}>
                        {selectedUser.iai_skill.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(selectedUser.iai_skill.score)}`}
                        style={{ width: `${selectedUser.iai_skill.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedUser.iai_skill.questionTaken} savol</p>
                  </div>
                )}

                {selectedUser.cas_skill && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700">CAS Skill</span>
                      <span className={`text-sm font-semibold ${getScoreColor(selectedUser.cas_skill.score)}`}>
                        {selectedUser.cas_skill.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(selectedUser.cas_skill.score)}`}
                        style={{ width: `${selectedUser.cas_skill.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedUser.cas_skill.questionTaken} savol</p>
                  </div>
                )}

                {selectedUser.accuracy && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-gray-700">Aniqlik</span>
                      <span className={`text-sm font-semibold ${getScoreColor(selectedUser.accuracy.score)}`}>
                        {selectedUser.accuracy.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(selectedUser.accuracy.score)}`}
                        style={{ width: `${selectedUser.accuracy.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedUser.accuracy.totalTestsTaken} test</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date(selectedUser.createdAt).toLocaleDateString('uz-UZ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;