import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupService } from '@/services/group.service';
import { Group, User } from '@/types';
import { Users, Settings, UserPlus, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    try {
      const data = await groupService.get(id!);
      setGroup(data);
    } catch (error) {
      console.error('Failed to load group:', error);
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!group) {
    return null;
  }

  const members = Array.isArray(group.members) ? group.members : [];

  return (
    <div>
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              <p className="text-gray-600 mb-4">{group.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {members.length} members
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-secondary flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
            </button>
            <button className="btn btn-secondary flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Members</h2>
          <button className="btn btn-primary flex items-center">
            <UserPlus className="w-4 h-4 mr-1" />
            Invite Members
          </button>
        </div>

        <div className="space-y-3">
          {members.map((member: any) => {
            const user = typeof member === 'string' ? null : member as User;
            return (
              <div key={typeof member === 'string' ? member : member.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary-600 font-medium">
                    {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email || ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
