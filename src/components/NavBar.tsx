
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const NavBar: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'ออกจากระบบสำเร็จ',
        description: 'ขอบคุณที่ใช้บริการ',
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm">
      <h1 className="text-xl font-bold">Dentteamapp</h1>
      <Button onClick={handleLogout} variant="outline">ออกจากระบบ</Button>
    </div>
  );
};

export default NavBar;
