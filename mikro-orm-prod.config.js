// Production-specific MikroORM configuration
const { JSMigrationGenerator } = require('@mikro-orm/migrations');
const { PostgreSqlDriver } = require('@mikro-orm/postgresql');
const { SqlHighlighter } = require('@mikro-orm/sql-highlighter');

// Import compiled entities directly
const { User } = require('./dist/module/user/entity/user.entity');
const { SellerInfo } = require('./dist/module/user/entity/seller-info.entity');
const { SellerUserBlock } = require('./dist/module/user/entity/seller-user-block.entity');
const { Login } = require('./dist/module/auth/entity/login.entity');
const { TokenBlacklist } = require('./dist/module/auth/entity/token-blacklist.entity');
const { Product } = require('./dist/module/product/entity/product.entity');
const { BroadcastProduct } = require('./dist/module/product/entity/broadcast-product.entity');
const { Broadcast } = require('./dist/module/broadcast/entity/broadcast.entity');
const { Stream } = require('./dist/module/broadcast/entity/stream.entity');
const { ViewLog } = require('./dist/module/broadcast/entity/view-log.entity');
const { Order } = require('./dist/module/order/entity/order.entity');
const { OrderItem } = require('./dist/module/order/entity/order-item.entity');
const { PurchaseLog } = require('./dist/module/order/entity/purchase-log.entity');
const { ReturnRequest } = require('./dist/module/order/entity/return-request.entity');
const { Payment } = require('./dist/module/payment/entity/payment.entity');
const { Refund } = require('./dist/module/payment/entity/refund.entity');
const { RefundEntity } = require('./dist/module/refund/entity/refund.entity');
const { RefundStatusHistoryEntity } = require('./dist/module/refund/entity/refund-status-history.entity');
const { Delivery } = require('./dist/module/delivery/entity/delivery.entity');
const { Follow } = require('./dist/module/user/entity/follow.entity');
const { Announcement } = require('./dist/module/announcement/entity/announcement.entity');
const { Cart } = require('./dist/module/cart/entity/cart.entity');
const { CartItem } = require('./dist/module/cart/entity/cart-item.entity');
const { Conversation } = require('./dist/module/message/entity/conversation.entity');
const { Message } = require('./dist/module/message/entity/message.entity');

module.exports = {
  driver: PostgreSqlDriver,
  entities: [
    User,
    SellerInfo,
    SellerUserBlock,
    Login,
    TokenBlacklist,
    Product,
    BroadcastProduct,
    Broadcast,
    Stream,
    ViewLog,
    Order,
    OrderItem,
    PurchaseLog,
    ReturnRequest,
    Payment,
    Refund,
    RefundEntity,
    RefundStatusHistoryEntity,
    Delivery,
    Follow,
    Announcement,
    Cart,
    CartItem,
    Conversation,
    Message,
  ],
  discovery: {
    disableDynamicFileAccess: true,
  },
  strict: true,
  allowGlobalContext: process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT === 'true',
  debug: false,
  highlighter: new SqlHighlighter(),
  migrations: {
    path: './dist/infra/database/migrations',
    generator: JSMigrationGenerator,
    glob: '!(*.d).{js,ts}',
  },
  seeder: {
    path: './dist/infra/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
    fileName: (className) => className,
  },
  // 환경별 데이터베이스 설정
  dbName: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  forceUtcTimezone: true,
};