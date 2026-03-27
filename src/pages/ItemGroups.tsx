import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Folders, ChevronRight } from 'lucide-react';

export function ItemGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await erpService.getItemGroups();
      setGroups(data);
    } catch { setGroups([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Nhóm vật tư</h1>
        <p className="text-xs lg:text-sm text-gray-400 mt-0.5">{groups.length} nhóm vật tư</p>
      </div>

      {/* List */}
      <div className="animate-slide-up stagger-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Folders className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có nhóm vật tư nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {groups.map((group, i) => (
              <div key={group.name} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Folders className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{group.item_group_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{group.name}</p>
                    {group.parent_item_group && (
                      <span className="chip chip-gray !text-[10px] mt-1.5 inline-flex">
                        <ChevronRight className="w-3 h-3 mr-0.5" />
                        {group.parent_item_group}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
