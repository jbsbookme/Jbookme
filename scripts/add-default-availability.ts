import { PrismaClient, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

async function addDefaultAvailability() {
  try {
    console.log('🔍 Buscando barberos sin disponibilidad...');
    
    // Get all active barbers
    const barbers = await prisma.barber.findMany({
      where: { isActive: true },
      include: {
        availability: true,
        user: true,
      },
    });

    console.log(`📊 Encontrados ${barbers.length} barberos activos`);

    const workDays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    for (const barber of barbers) {
      console.log(`\n👤 Verificando: ${barber.user.name}`);
      
      // Check which days have no availability
      const existingDays = barber.availability.map((a) => a.dayOfWeek);
      const missingDays = workDays.filter((day) => !existingDays.includes(day));

      if (missingDays.length === 0) {
        console.log(`  ✅ ${barber.user.name} ya tiene disponibilidad completa`);
        continue;
      }

      console.log(`  ⚠️  Faltan ${missingDays.length} días de disponibilidad`);
      console.log(`  📅 Agregando: ${missingDays.join(', ')}`);

      // Add default availability for missing days (9 AM - 6 PM)
      for (const day of missingDays) {
        await prisma.availability.create({
          data: {
            barberId: barber.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
            isAvailable: true,
          },
        });
      }

      console.log(`  ✅ Disponibilidad agregada para ${barber.user.name}`);
    }

    console.log('\n🎉 ¡Proceso completado exitosamente!');
    console.log('Todos los barberos ahora tienen disponibilidad de Lunes a Sábado, 9:00 AM - 6:00 PM');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultAvailability();
