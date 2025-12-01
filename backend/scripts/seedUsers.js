const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const BusinessSettings = require('../models/BusinessSettings');

// ==================== CONNECT DATABASE ====================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Database connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// ==================== HASH PASSWORD ====================

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// ==================== SEED USERS ====================

const seedUsers = async () => {
  try {
    // Check if users exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('⏭️  Users already exist. Skipping user seeding.');
      return;
    }

    console.log('🌱 Seeding users...');

    // Create CEO
    const ceoPassword = await hashPassword('CEO@12345');
    const ceo = await User.create({
      name: 'Julius CEO',
      email: 'julius@jn-automation.de',
      password: ceoPassword,
      role: 'ceo',
      isActive: true,
      emailVerified: true
    });
    console.log('✅ CEO created:', ceo.email);

    // Create Admin
    const adminPassword = await hashPassword('Admin@12345');
    const admin = await User.create({
      name: 'Anna Admin',
      email: 'anna@meinsalon.de',
      password: adminPassword,
      role: 'admin',
      companyId: ceo._id,
      companyName: 'Mein Salon',
      isActive: true,
      emailVerified: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create Employees
    const employees = [];
    const employeeNames = [
      { first: 'Maria', last: 'Schmidt' },
      { first: 'Clara', last: 'Müller' },
      { first: 'Sophie', last: 'Weber' }
    ];

    for (let i = 0; i < employeeNames.length; i++) {
      const empPassword = await hashPassword(`Employee@${12345 + i}`);
      const employee = await User.create({
        firstName: employeeNames[i].first,
        lastName: employeeNames[i].last,
        name: `${employeeNames[i].first} ${employeeNames[i].last}`,
        email: `${employeeNames[i].first.toLowerCase()}@meinsalon.de`,
        password: empPassword,
        role: 'employee',
        companyId: admin._id,
        phone: `+49${1000000000 + i}`,
        isActive: true,
        emailVerified: true
      });
      employees.push(employee);
      console.log(`✅ Employee created: ${employee.email}`);
    }

    return { ceo, admin, employees };
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// ==================== SEED BUSINESS SETTINGS ====================

const seedBusinessSettings = async (admin) => {
  try {
    const existingSettings = await BusinessSettings.findOne({
      companyId: admin._id
    });

    if (existingSettings) {
      console.log('⏭️  Business settings already exist. Skipping.');
      return existingSettings;
    }

    console.log('🌱 Seeding business settings...');

    const settings = await BusinessSettings.create({
      companyId: admin._id,
      businessName: 'Mein Salon',
      businessEmail: 'info@meinsalon.de',
      businessPhone: '+49123456789',
      businessAddress: {
        street: 'Hauptstr. 123',
        city: 'Berlin',
        zipCode: '10115',
        country: 'DE'
      },
      businessDescription: 'Ein moderner Salon mit erstklassigen Services',
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '19:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      timezone: 'Europe/Berlin',
      currency: 'EUR',
      language: 'de',
      bookingSettings: {
        maxBookingsPerDay: 20,
        minAdvanceBooking: 24,
        maxAdvanceBooking: 90,
        bufferTimeBetweenAppointments: 15,
        requireEmailConfirmation: false,
        autoConfirmBookings: true,
        allowCancellations: true,
        cancellationDeadline: 24
      },
      paymentSettings: {
        enablePayments: true,
        requirePaymentUpfront: false,
        defaultPaymentMethod: 'card',
        acceptedPaymentMethods: ['card', 'cash'],
        taxRate: 19
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        features: {
          maxEmployees: 10,
          maxCustomers: 1000,
          apiAccess: true,
          advancedReporting: true,
          customBranding: true,
          prioritySupport: true
        }
      }
    });

    console.log('✅ Business settings created');
    return settings;
  } catch (error) {
    console.error('❌ Error seeding business settings:', error);
    throw error;
  }
};

// ==================== SEED SERVICES ====================

const seedServices = async (admin) => {
  try {
    const existingServices = await Service.countDocuments({
      companyId: admin._id
    });

    if (existingServices > 0) {
      console.log('⏭️  Services already exist. Skipping.');
      return;
    }

    console.log('🌱 Seeding services...');

    const services = [
      {
        name: 'Haarschnitt',
        price: 35,
        duration: 30,
        category: 'Hairstyling',
        description: 'Professioneller Haarschnitt nach Wunsch',
        shortDescription: 'Friseurschnitt'
      },
      {
        name: 'Haarfärben',
        price: 60,
        duration: 90,
        category: 'Hairstyling',
        description: 'Komplette Haarfärbung mit hochwertigen Produkten',
        shortDescription: 'Vollständige Haarfärbung'
      },
      {
        name: 'Gesichtsmassage',
        price: 45,
        duration: 45,
        category: 'Wellness',
        description: 'Entspannende Gesichtsmassage mit Wellness-Produkten',
        shortDescription: 'Entspannende Massage'
      },
      {
        name: 'Maniküre',
        price: 30,
        duration: 45,
        category: 'Nails',
        description: 'Professionelle Maniküre mit hochwertigen Nagellacken',
        shortDescription: 'Hand- und Nagelpflege'
      },
      {
        name: 'Pediküre',
        price: 40,
        duration: 60,
        category: 'Nails',
        description: 'Professionelle Fußpflege und Nagelpflege',
        shortDescription: 'Fuß- und Nagelpflege'
      },
      {
        name: 'Gesichtsbehandlung',
        price: 55,
        duration: 60,
        category: 'Skincare',
        description: 'Tiefenreinigende Gesichtsbehandlung',
        shortDescription: 'Hautpflege-Behandlung'
      }
    ];

    const createdServices = [];
    for (const service of services) {
      const newService = await Service.create({
        ...service,
        companyId: admin._id,
        status: 'active',
        isAvailable: true,
        isFeatured: Math.random() > 0.5,
        rating: Math.floor(Math.random() * 5) + 3
      });
      createdServices.push(newService);
      console.log(`✅ Service created: ${newService.name}`);
    }

    return createdServices;
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    throw error;
  }
};

// ==================== SEED CUSTOMERS ====================

const seedCustomers = async (admin) => {
  try {
    const existingCustomers = await Customer.countDocuments({
      companyId: admin._id
    });

    if (existingCustomers > 0) {
      console.log('⏭️  Customers already exist. Skipping.');
      return;
    }

    console.log('🌱 Seeding customers...');

    const customers = [
      {
        name: 'Max Müller',
        email: 'max.mueller@example.de',
        phone: '+49301234567',
        address: {
          street: 'Frankfurter Str. 45',
          city: 'Berlin',
          zipCode: '10115',
          country: 'DE'
        }
      },
      {
        name: 'Lisa Schmidt',
        email: 'lisa.schmidt@example.de',
        phone: '+49301234568',
        address: {
          street: 'Kurfürstendamm 12',
          city: 'Berlin',
          zipCode: '10719',
          country: 'DE'
        }
      },
      {
        name: 'Julia Weber',
        email: 'julia.weber@example.de',
        phone: '+49301234569',
        address: {
          street: 'Unter den Linden 77',
          city: 'Berlin',
          zipCode: '10117',
          country: 'DE'
        }
      },
      {
        name: 'Tom König',
        email: 'tom.koenig@example.de',
        phone: '+49301234570',
        address: {
          street: 'Alexanderplatz 1',
          city: 'Berlin',
          zipCode: '10178',
          country: 'DE'
        }
      },
      {
        name: 'Sarah Bauer',
        email: 'sarah.bauer@example.de',
        phone: '+49301234571',
        address: {
          street: 'Potsdamer Str. 88',
          city: 'Berlin',
          zipCode: '10785',
          country: 'DE'
        }
      }
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const newCustomer = await Customer.create({
        ...customer,
        companyId: admin._id,
        type: Math.random() > 0.7 ? 'vip' : 'regular',
        isActive: true,
        totalVisits: Math.floor(Math.random() * 20) + 1,
        totalSpent: Math.floor(Math.random() * 500) + 50,
        lastVisitDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      createdCustomers.push(newCustomer);
      console.log(`✅ Customer created: ${newCustomer.name}`);
    }

    return createdCustomers;
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    throw error;
  }
};

// ==================== SEED APPOINTMENTS ====================

const seedAppointments = async (admin, employees, customers, services) => {
  try {
    const existingAppointments = await Appointment.countDocuments({
      companyId: admin._id
    });

    if (existingAppointments > 0) {
      console.log('⏭️  Appointments already exist. Skipping.');
      return;
    }

    console.log('🌱 Seeding appointments...');

    const appointments = [];
    for (let i = 0; i < 15; i++) {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 14));
      appointmentDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
      const randomService = services[Math.floor(Math.random() * services.length)];

      const appointment = await Appointment.create({
        customerId: randomCustomer._id,
        employeeId: randomEmployee._id,
        serviceId: randomService._id,
        companyId: admin._id,
        appointmentDate,
        duration: randomService.duration,
        status: Math.random() > 0.3 ? 'scheduled' : 'completed',
        price: randomService.price,
        finalPrice: randomService.price,
        paymentStatus: 'paid',
        customerName: randomCustomer.name,
        customerEmail: randomCustomer.email,
        customerPhone: randomCustomer.phone,
        notes: 'Gebucht über System'
      });
      appointments.push(appointment);
      console.log(`✅ Appointment created for ${randomCustomer.name}`);
    }

    return appointments;
  } catch (error) {
    console.error('❌ Error seeding appointments:', error);
    throw error;
  }
};

// ==================== SEED EMPLOYEES ====================

const seedEmployeesData = async (admin, employees) => {
  try {
    const existingEmployees = await Employee.countDocuments({
      companyId: admin._id
    });

    if (existingEmployees > 0) {
      console.log('⏭️  Employee data already exists. Skipping.');
      return;
    }

    console.log('🌱 Seeding employee data...');

    for (const user of employees) {
      const employee = await Employee.create({
        userId: user._id,
        companyId: admin._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        position: 'Friseur/in',
        employmentType: 'full-time',
        status: 'active',
        workSchedule: {
          monday: { start: '09:00', end: '18:00', working: true },
          tuesday: { start: '09:00', end: '18:00', working: true },
          wednesday: { start: '09:00', end: '18:00', working: true },
          thursday: { start: '09:00', end: '18:00', working: true },
          friday: { start: '09:00', end: '19:00', working: true },
          saturday: { start: '10:00', end: '16:00', working: true },
          sunday: { start: '00:00', end: '00:00', working: false }
        }
      });
      console.log(`✅ Employee data created for ${employee.fullName}`);
    }
  } catch (error) {
    console.error('❌ Error seeding employee data:', error);
    throw error;
  }
};

// ==================== MAIN SEED FUNCTION ====================

const seed = async () => {
  try {
    console.log('\n🚀 Starting database seed...\n');

    await connectDB();

    // Seed users
    const { admin, employees } = await seedUsers();

    // Seed business settings
    await seedBusinessSettings(admin);

    // Seed services
    const services = await seedServices(admin);

    // Seed customers
    const customers = await seedCustomers(admin);

    // Seed appointments
    await seedAppointments(admin, employees, customers, services);

    // Seed employee data
    await seedEmployeesData(admin, employees);

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📋 Default login credentials:');
    console.log('   CEO: julius@jn-automation.de / CEO@12345');
    console.log('   Admin: anna@meinsalon.de / Admin@12345');
    console.log('   Employee 1: maria@meinsalon.de / Employee@12345');
    console.log('   Employee 2: clara@meinsalon.de / Employee@12346');
    console.log('   Employee 3: sophie@meinsalon.de / Employee@12347\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
