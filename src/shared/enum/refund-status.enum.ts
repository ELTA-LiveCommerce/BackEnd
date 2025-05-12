export enum RefundStatus {
  REQUESTED = 'requested', // 요청됨
  PROCESSING = 'processing', // 처리중
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 거부됨
  COMPLETED = 'completed', // 완료됨 (환불 처리 완료)
}
