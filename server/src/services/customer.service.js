import prisma from '../config/database.js';

export const getAllCustomers = async () => {
  return prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
};

export const getCustomerById = async (id) => {
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) throw new Error('Customer not found');
  return c;
};

export const createCustomer = async (data) => {
  return prisma.customer.create({
    data: {
      name: data.name?.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  });
};

export const updateCustomer = async (id, data) => {
  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  });
};

export const deleteCustomer = async (id) => {
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) throw new Error('Customer not found');
  await prisma.customer.delete({ where: { id } });
  return c;
};
