import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with same phone already exists
    this.logger.log(`Attempting to create user with phone: ${JSON.stringify(createUserDto)}`);
    const existingUser = await this.userRepository.findOne({
      where: [
        { phone: createUserDto.phone },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      this.logger.warn(`Attempt to create user with existing phone: ${createUserDto.phone}`);
      // throw new ConflictException(`User with phone ${createUserDto.phone} already exists`);
      return existingUser; // Return existing user instead of throwing an error
    }

    const user = this.userRepository.create({ ...createUserDto, passwordHash: createUserDto.password });
    return this.userRepository.save(user);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: User[]; total: number }> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }

    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByPhone(phone: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new NotFoundException(`User with phone ${phone} not found`);
    }

    return user;
  }

  async findByIdentifier(identifier: string): Promise<User> {
    // Try to find by phone first
    const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier);
    if (isPhone) {
      return this.findByPhone(identifier);
    }
    const user = await this.userRepository.findOne({ where: { email: identifier } });

    if (!user) {
      // throw new NotFoundException(`User with email ${identifier} not found`);
      return user!; // Return null if user not found by email
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if phone is being updated and if it's already taken
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone },
      });
      if (existingUser) {
        throw new ConflictException(`User with phone ${updateUserDto.phone} already exists`);
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: `User with ID ${id} deleted successfully` };
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'blocked'): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.lastLoginAt = new Date();
    return this.userRepository.save(user);
  }

  async verifyPhone(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.phoneVerified = true;
    return this.userRepository.save(user);
  }
}
