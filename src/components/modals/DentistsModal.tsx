
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrashIcon, PlusCircleIcon } from 'lucide-react';
import { loadDentists, saveDentists } from '@/lib/data-utils';
import { useToast } from '@/hooks/use-toast';

interface DentistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDentistsUpdated: () => void;
}

const DentistsModal: React.FC<DentistsModalProps> = ({ isOpen, onClose, onDentistsUpdated }) => {
  const [dentists, setDentists] = useState<Record<string, string>>({});
  const [newDentistName, setNewDentistName] = useState('');
  const [newDentistId, setNewDentistId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDentistData();
    }
  }, [isOpen]);

  const loadDentistData = async () => {
    try {
      const dentistsData = await loadDentists();
      setDentists(dentistsData);
    } catch (error) {
      console.error('Failed to load dentists:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลทันตแพทย์ได้',
        variant: 'destructive',
      });
    }
  };

  const handleAddDentist = async () => {
    if (!newDentistId || !newDentistName) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกรหัสและชื่อทันตแพทย์',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedDentists = { ...dentists, [newDentistId]: newDentistName };
      await saveDentists(updatedDentists);
      
      // Update state after successful save
      setDentists(updatedDentists);
      setNewDentistId('');
      setNewDentistName('');
      
      toast({
        title: 'เพิ่มทันตแพทย์สำเร็จ',
        description: `เพิ่ม ${newDentistName} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Failed to add dentist:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มทันตแพทย์ได้',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveDentist = async (id: string) => {
    try {
      const updatedDentists = { ...dentists };
      delete updatedDentists[id];
      
      await saveDentists(updatedDentists);
      
      // Update state after successful save
      setDentists(updatedDentists);
      
      toast({
        title: 'ลบทันตแพทย์สำเร็จ',
        description: `ลบทันตแพทย์ ${dentists[id]} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Failed to remove dentist:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบทันตแพทย์ได้',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    onDentistsUpdated();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>จัดการทันตแพทย์</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="รหัส"
              value={newDentistId}
              onChange={(e) => setNewDentistId(e.target.value)}
              className="col-span-1"
            />
            <Input
              placeholder="ชื่อทันตแพทย์"
              value={newDentistName}
              onChange={(e) => setNewDentistName(e.target.value)}
              className="col-span-1"
            />
            <Button onClick={handleAddDentist} className="col-span-1">
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              เพิ่ม
            </Button>
          </div>
          
          <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">รหัส</th>
                  <th className="text-left py-2 px-2">ชื่อ</th>
                  <th className="text-right py-2 px-2">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dentists).map(([id, name]) => (
                  <tr key={id} className="border-b last:border-b-0">
                    <td className="py-2 px-2">{id}</td>
                    <td className="py-2 px-2">{name}</td>
                    <td className="py-2 px-2 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveDentist(id)}
                        className="h-8 w-8 p-0"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {Object.keys(dentists).length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted-foreground">
                      ไม่พบข้อมูลทันตแพทย์
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DentistsModal;
