
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loadDentists, saveDentists } from '@/lib/data-utils';

interface DentistsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DentistsModal: React.FC<DentistsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [newDentistName, setNewDentistName] = useState<string>('');
  const [newDentistColor, setNewDentistColor] = useState<string>('#ff9999');
  const [dentists, setDentists] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadDentistsList();
    }
  }, [isOpen]);

  const loadDentistsList = () => {
    const dentistsData = loadDentists();
    setDentists(dentistsData);
  };

  const handleAddDentist = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDentistName || !newDentistColor) return;
    
    const dentistsData = loadDentists();
    dentistsData[newDentistName] = newDentistColor;
    saveDentists(dentistsData);
    
    setNewDentistName('');
    setNewDentistColor('#ff9999');
    loadDentistsList();
  };

  const handleDeleteDentist = (dentistName: string) => {
    if (window.confirm(`คุณต้องการลบหมอ ${dentistName} ออกจากรายชื่อหรือไม่?`)) {
      const dentistsData = loadDentists();
      delete dentistsData[dentistName];
      saveDentists(dentistsData);
      loadDentistsList();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>จัดการรายชื่อหมอ</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleAddDentist} className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="new-dentist-name">ชื่อหมอ:</Label>
            <input
              type="text"
              id="new-dentist-name"
              value={newDentistName}
              onChange={(e) => setNewDentistName(e.target.value)}
              className="p-2 border rounded"
              placeholder="ชื่อหมอ"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="new-dentist-color">สี:</Label>
            <input
              type="color"
              id="new-dentist-color"
              value={newDentistColor}
              onChange={(e) => setNewDentistColor(e.target.value)}
              className="p-2 border rounded h-10"
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">เพิ่มหมอ</Button>
          </DialogFooter>
        </form>
        
        {/* แสดงรายชื่อหมอทั้งหมด */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">รายชื่อหมอทั้งหมด</h3>
          <div className="space-y-2">
            {Object.entries(dentists).map(([name, color], index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                <div 
                  style={{ backgroundColor: color }} 
                  className="w-5 h-5 rounded"
                ></div>
                <span className="flex-grow">{name}</span>
                <Button 
                  variant="outline"
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDeleteDentist(name)}
                >
                  ลบ
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DentistsModal;
